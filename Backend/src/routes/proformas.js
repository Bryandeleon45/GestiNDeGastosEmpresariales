import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";
import { enviar } from "../services/notificaciones.service.js";

const router = Router();

router.use(authenticate);

const ROLES_GESTION = [
  "Administrador General",
  "Encargado de Compras",
  "Encargado de Almacén",
  "DAFIM",
  "Alcalde Municipal",
];

function esGestion(user) {
  return ROLES_GESTION.includes(user.rol);
}

function yearNow() {
  return new Date().getFullYear();
}

async function nextNumero(prefix, table, column, client) {
  const anio = yearNow();
  const { rows } = await client.query(
    `SELECT COALESCE(MAX(SPLIT_PART(${column}, '-', 3)::int), 0) + 1 AS siguiente
       FROM ${table}
      WHERE ${column} LIKE '${prefix}-' || $1 || '-%'`,
    [anio],
  );
  return `${prefix}-${anio}-${String(rows[0].siguiente).padStart(3, "0")}`;
}

function dependenciaDeUsuario(id_usuario) {
  return pool
    .query(
      `SELECT e.id_dependencia
         FROM usuario u
         JOIN empleado e ON e.id_empleado = u.id_empleado
        WHERE u.id_usuario = $1`,
      [id_usuario],
    )
    .then(({ rows }) => rows[0]?.id_dependencia ?? null);
}

// Ejecuta la adjudicación de una cotización ganadora: marca estados,
// genera la orden de compra y actualiza proceso/requisición.
async function adjudicarInterno(client, proceso, cotizacion, motivo, idUsuario) {
  await client.query(
    "UPDATE cotizacion SET estado_cotizacion = 'Rechazada', seleccionada = FALSE WHERE id_requisicion = $1 AND id_cotizacion <> $2",
    [proceso.id_requisicion, cotizacion.id_cotizacion],
  );
  await client.query(
    "UPDATE cotizacion SET estado_cotizacion = 'Aceptada', seleccionada = TRUE, motivo_rechazo = NULL WHERE id_cotizacion = $1",
    [cotizacion.id_cotizacion],
  );

  const numeroOrden = await nextNumero("OC", "orden_compra", "numero_orden", client);

  // Reutiliza la orden de compra provisional creada al registrar la solicitud,
  // conservando el mismo número durante todo el proceso.
  const ocExistente = await client.query(
    "SELECT * FROM orden_compra WHERE id_requisicion = $1 FOR UPDATE",
    [proceso.id_requisicion],
  );
  let orden;
  if (ocExistente.rows[0]) {
    const prev = ocExistente.rows[0];
    const { rows: updRows } = await client.query(
      `UPDATE orden_compra
          SET id_cotizacion = $1, id_proveedor = $2, plazo_credito_dias = $3
        WHERE id_orden_compra = $4
        RETURNING *`,
      [cotizacion.id_cotizacion, cotizacion.id_proveedor, cotizacion.plazo_credito_dias ?? null, prev.id_orden_compra],
    );
    orden = updRows[0];
    await client.query("DELETE FROM detalle_orden_compra WHERE id_orden_compra = $1", [orden.id_orden_compra]);
  } else {
    const { rows: ocRows } = await client.query(
      `INSERT INTO orden_compra
         (numero_orden, id_requisicion, id_cotizacion, id_proveedor, monto_total, id_usuario_emite, plazo_credito_dias)
       VALUES ($1, $2, $3, $4, 0, $5, $6)
       RETURNING *`,
      [
        numeroOrden,
        proceso.id_requisicion,
        cotizacion.id_cotizacion,
        cotizacion.id_proveedor,
        idUsuario,
        cotizacion.plazo_credito_dias ?? null,
      ],
    );
    orden = ocRows[0];
  }

  const detRes = await client.query(
    "SELECT * FROM detalle_cotizacion WHERE id_cotizacion = $1",
    [cotizacion.id_cotizacion],
  );
  for (const d of detRes.rows) {
    await client.query(
      `INSERT INTO detalle_orden_compra
         (id_orden_compra, id_detalle_requisicion, cantidad_comprada, precio_unitario)
       VALUES ($1, $2, $3, $4)`,
      [orden.id_orden_compra, d.id_detalle_requisicion, d.cantidad_cotizada, d.precio_unitario],
    );
  }

  await client.query(
    `UPDATE proceso_cotizacion
        SET fase = 'Adjudicada', motivo_adjudicacion = $1,
            id_usuario_adjudica = $2, fecha_adjudicacion = now()
      WHERE id_proceso = $3`,
    [motivo, idUsuario, proceso.id_proceso],
  );

  // La solicitud pasa a revisión de bodega (caso especial de proformas adjudicadas).
  await client.query(
    "UPDATE requisicion SET estado = 'En Revisión', adjudicada = TRUE WHERE id_requisicion = $1",
    [proceso.id_requisicion],
  );

  return orden;
}

// ── Listado de procesos ───────────────────────────────────────────────────────
router.get("/procesos", authorize("proformas"), async (req, res, next) => {
  try {
    const { fase, q } = req.query;
    const where = ["1=1"];
    const params = [];
    const add = (v) => params.push(v);

    if (fase) {
      where.push(`pc.fase = $${params.length + 1}`);
      add(fase);
    }
    if (q) {
      where.push(`r.codigo_requisicion ILIKE $${params.length + 1}`);
      add(`%${q}%`);
    }

    const { rows } = await pool.query(
      `SELECT pc.id_proceso, pc.id_requisicion, pc.fase, pc.fecha_publicacion,
              pc.fecha_limite, pc.min_ofertas, pc.motivo_adjudicacion,
              r.codigo_requisicion, r.tipo_solicitud, r.monto_estimado,
              d.nombre_dependencia,
              (SELECT COUNT(*)::int FROM cotizacion c WHERE c.id_requisicion = pc.id_requisicion) AS total_cotizaciones,
              (SELECT COUNT(*)::int FROM invitacion_proveedor ip WHERE ip.id_proceso = pc.id_proceso) AS total_invitados
         FROM proceso_cotizacion pc
         JOIN requisicion r ON r.id_requisicion = pc.id_requisicion
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
        WHERE ${where.join(" AND ")}
        ORDER BY pc.fecha_publicacion DESC`,
      params,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Requisiciones aprobadas sin proceso (para publicar) ───────────────────────
router.get("/requisiciones-aprobadas", authorize("proformas"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id_requisicion, r.codigo_requisicion, r.tipo_solicitud,
              r.justificacion, r.monto_estimado, r.prioridad, r.fecha_solicitud,
              d.nombre_dependencia
         FROM requisicion r
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
        WHERE r.estado = 'Aprobada'
          AND NOT EXISTS (SELECT 1 FROM proceso_cotizacion pc WHERE pc.id_requisicion = r.id_requisicion)
        ORDER BY r.fecha_solicitud DESC`,
    );

    const ids = rows.map((r) => r.id_requisicion);
    const itemsPorRequisicion = new Map();
    if (ids.length) {
      const { rows: items } = await pool.query(
        `SELECT dr.id_requisicion, dr.id_detalle, dr.cantidad, dr.precio_estimado,
                dr.descripcion_libre, dr.observaciones,
                i.nombre AS insumo_nombre, i.codigo_insumo,
                um.nombre AS unidad_nombre, um.simbolo AS unidad_simbolo
           FROM detalle_requisicion dr
           LEFT JOIN insumo i ON i.id_insumo = dr.id_insumo
           JOIN unidad_medida um ON um.id_unidad_medida = dr.id_unidad_medida
          WHERE dr.id_requisicion = ANY($1::int[])
          ORDER BY dr.id_requisicion, dr.id_detalle`,
        [ids],
      );
      for (const it of items) {
        if (!itemsPorRequisicion.has(it.id_requisicion)) itemsPorRequisicion.set(it.id_requisicion, []);
        itemsPorRequisicion.get(it.id_requisicion).push(it);
      }
    }

    res.json(rows.map((r) => ({ ...r, items: itemsPorRequisicion.get(r.id_requisicion) ?? [] })));
  } catch (e) {
    next(e);
  }
});

// ── Proveedores activos (para invitar) ────────────────────────────────────────
router.get("/proveedores-activos", authorize("proformas"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_proveedor, nit, razon_social, correo, telefono
         FROM proveedor
        WHERE activo = TRUE
        ORDER BY razon_social`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Publicar proceso ───────────────────────────────────────────────────────────
router.post("/procesos", authorize("proformas"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id_requisicion, fecha_limite, min_ofertas = 3, proveedores = [] } = req.body;
    if (!id_requisicion) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "id_requisicion es requerido" });
    }
    if (!fecha_limite) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La fecha límite es requerida" });
    }

    // fecha_limite llega como "YYYY-MM-DD" (solo fecha, sin hora).
    const fechaDia = new Date(`${fecha_limite}T00:00:00`);
    if (Number.isNaN(fechaDia.getTime())) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Fecha límite inválida" });
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaDia < hoy) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La fecha límite no puede ser anterior a hoy" });
    }
    // Se guarda al final del día para que el plazo venza hasta terminar esa fecha.
    const fechaLimite = new Date(`${fecha_limite}T23:59:59`);

    const reqRes = await client.query(
      "SELECT * FROM requisicion WHERE id_requisicion = $1",
      [id_requisicion],
    );
    const requisicion = reqRes.rows[0];
    if (!requisicion) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Requisición no encontrada" });
    }
    if (requisicion.estado !== "Aprobada") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Solo se pueden publicar solicitudes Aprobadas" });
    }

    const dup = await client.query(
      "SELECT 1 FROM proceso_cotizacion WHERE id_requisicion = $1",
      [id_requisicion],
    );
    if (dup.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Esta requisición ya tiene un proceso de cotización" });
    }

    const { rows: procRows } = await client.query(
      `INSERT INTO proceso_cotizacion
         (id_requisicion, fecha_limite, min_ofertas, id_usuario_publica)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id_requisicion, fechaLimite, min_ofertas, req.user.id_usuario],
    );
    const proceso = procRows[0];

    for (const idProveedor of proveedores) {
      await client.query(
        `INSERT INTO invitacion_proveedor (id_proceso, id_proveedor)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [proceso.id_proceso, idProveedor],
      );
    }

    // La solicitud pasa a En Compra al publicar.
    await client.query(
      "UPDATE requisicion SET estado = 'En Compra', adjudicada = FALSE WHERE id_requisicion = $1",
      [id_requisicion],
    );

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "proceso_publicado",
      ip: ipDe(req),
      modulo: "Proformas",
      detalle: `Publicado proceso de cotización para ${requisicion.codigo_requisicion}`,
    });

    res.status(201).json(proceso);
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23514") {
      return res.status(400).json({ error: "La fecha límite debe ser hoy o una fecha futura" });
    }
    next(e);
  } finally {
    client.release();
  }
});

// ── Detalle de proceso ─────────────────────────────────────────────────────────
router.get("/procesos/:id", authorize("proformas"), async (req, res, next) => {
  try {
    const { rows: procRows } = await pool.query(
      `SELECT pc.*, r.codigo_requisicion, r.tipo_solicitud, r.justificacion,
              r.lugar_entrega, r.prioridad, r.monto_estimado, r.estado AS estado_requisicion,
              d.nombre_dependencia
         FROM proceso_cotizacion pc
         JOIN requisicion r ON r.id_requisicion = pc.id_requisicion
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
        WHERE pc.id_proceso = $1`,
      [req.params.id],
    );
    if (!procRows[0]) return res.status(404).json({ error: "Proceso no encontrado" });
    const proceso = procRows[0];

    const { rows: items } = await pool.query(
      `SELECT dr.*, i.nombre AS insumo_nombre, i.codigo_insumo,
              um.nombre AS unidad_nombre, um.simbolo AS unidad_simbolo
         FROM detalle_requisicion dr
         LEFT JOIN insumo i ON i.id_insumo = dr.id_insumo
         JOIN unidad_medida um ON um.id_unidad_medida = dr.id_unidad_medida
        WHERE dr.id_requisicion = $1
        ORDER BY dr.id_detalle`,
      [proceso.id_requisicion],
    );

    const { rows: invitados } = await pool.query(
      `SELECT ip.id_invitacion, ip.id_proveedor, ip.fecha_invitacion, ip.fecha_vista,
              p.nit, p.razon_social, p.correo, p.telefono
         FROM invitacion_proveedor ip
         JOIN proveedor p ON p.id_proveedor = ip.id_proveedor
        WHERE ip.id_proceso = $1
        ORDER BY p.razon_social`,
      [proceso.id_proceso],
    );

    const { rows: cotizaciones } = await pool.query(
      `SELECT c.*, p.nit, p.razon_social, p.correo
         FROM cotizacion c
         JOIN proveedor p ON p.id_proveedor = c.id_proveedor
        WHERE c.id_requisicion = $1
        ORDER BY c.fecha_registro`,
      [proceso.id_requisicion],
    );

    res.json({ ...proceso, items, invitados, cotizaciones });
  } catch (e) {
    next(e);
  }
});

// ── Gestionar invitaciones (agregar/quitar proveedores) ───────────────────────
router.put("/procesos/:id/invitaciones", authorize("proformas"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: procRows } = await client.query(
      "SELECT * FROM proceso_cotizacion WHERE id_proceso = $1",
      [req.params.id],
    );
    const proceso = procRows[0];
    if (!proceso) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Proceso no encontrado" });
    }
    if (proceso.fase !== "Publicada") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Solo se pueden gestionar invitaciones en fase Publicada" });
    }

    const { proveedores } = req.body;
    if (!Array.isArray(proveedores)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "proveedores debe ser un arreglo de ids" });
    }

    const nuevoSet = new Set(proveedores.map((id) => Number(id)));
    const actuales = await client.query(
      "SELECT id_proveedor FROM invitacion_proveedor WHERE id_proceso = $1",
      [proceso.id_proceso],
    );
    const actualSet = new Set(actuales.rows.map((r) => r.id_proveedor));

    for (const id of actualSet) {
      if (!nuevoSet.has(id)) {
        await client.query(
          "DELETE FROM invitacion_proveedor WHERE id_proceso = $1 AND id_proveedor = $2",
          [proceso.id_proceso, id],
        );
      }
    }
    for (const id of nuevoSet) {
      if (!actualSet.has(id)) {
        await client.query(
          "INSERT INTO invitacion_proveedor (id_proceso, id_proveedor) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [proceso.id_proceso, id],
        );
      }
    }

    await client.query("COMMIT");

    const { rows: invitados } = await client.query(
      `SELECT ip.id_invitacion, ip.id_proveedor, ip.fecha_invitacion, ip.fecha_vista,
              p.nit, p.razon_social, p.correo, p.telefono
         FROM invitacion_proveedor ip
         JOIN proveedor p ON p.id_proveedor = ip.id_proveedor
        WHERE ip.id_proceso = $1
        ORDER BY p.razon_social`,
      [proceso.id_proceso],
    );

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "invitaciones_actualizadas",
      ip: ipDe(req),
      modulo: "Proformas",
      detalle: `Invitaciones actualizadas en el proceso ${proceso.id_proceso}`,
    });

    res.json(invitados);
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Registro manual de cotización ──────────────────────────────────────────────
router.post("/procesos/:id/cotizaciones", authorize("proformas"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: procRows } = await client.query(
      "SELECT * FROM proceso_cotizacion WHERE id_proceso = $1",
      [req.params.id],
    );
    const proceso = procRows[0];
    if (!proceso) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Proceso no encontrado" });
    }
    if (proceso.fase !== "Publicada") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Solo se reciben cotizaciones en fase Publicada" });
    }

    const { id_proveedor, condiciones_pago, tiempo_entrega_dias, tiempo_entrega_texto, referencia_proveedor, items } = req.body;
    if (!id_proveedor) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El proveedor es requerido" });
    }
    if (!Array.isArray(items) || !items.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Debe incluir al menos un ítem" });
    }

    const numero = await nextNumero("COT", "cotizacion", "numero_cotizacion", client);
    const { rows: cotRows } = await client.query(
      `INSERT INTO cotizacion
         (id_requisicion, id_proveedor, numero_cotizacion, referencia_proveedor,
          condiciones_pago, tiempo_entrega_dias, tiempo_entrega_texto, origen, id_usuario_registra)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'MANUAL', $8)
       RETURNING *`,
      [
        proceso.id_requisicion,
        id_proveedor,
        numero,
        referencia_proveedor ?? null,
        condiciones_pago ?? null,
        tiempo_entrega_dias ?? null,
        tiempo_entrega_texto ?? null,
        req.user.id_usuario,
      ],
    );
    const cotizacion = cotRows[0];

    let montoTotal = 0;
    for (const it of items) {
      const cantidad = parseFloat(it.cantidad) || 0;
      const precio = parseFloat(it.precio_unitario) || 0;
      montoTotal += cantidad * precio;
      await client.query(
        `INSERT INTO detalle_cotizacion
           (id_cotizacion, id_detalle_requisicion, cantidad_cotizada, precio_unitario, descripcion_oferta)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          cotizacion.id_cotizacion,
          it.id_detalle_requisicion,
          cantidad,
          precio,
          it.descripcion_oferta ?? null,
        ],
      );
    }

    await client.query(
      "UPDATE cotizacion SET monto_total = $1 WHERE id_cotizacion = $2",
      [montoTotal.toFixed(2), cotizacion.id_cotizacion],
    );

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "cotizacion_registrada",
      ip: ipDe(req),
      modulo: "Proformas",
      detalle: `Registro manual de cotización ${numero}`,
    });

    res.status(201).json({ ...cotizacion, monto_total: montoTotal.toFixed(2) });
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505") {
      return res.status(409).json({ error: "Ese proveedor ya cotizó esta solicitud" });
    }
    next(e);
  } finally {
    client.release();
  }
});

// ── Comparativa ────────────────────────────────────────────────────────────────
router.get("/procesos/:id/comparativa", authorize("proformas"), async (req, res, next) => {
  try {
    const { rows: procRows } = await pool.query(
      `SELECT pc.*, r.codigo_requisicion, r.tipo_solicitud, r.monto_estimado,
              r.monto_adjudicado, d.nombre_dependencia
         FROM proceso_cotizacion pc
         JOIN requisicion r ON r.id_requisicion = pc.id_requisicion
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
        WHERE pc.id_proceso = $1`,
      [req.params.id],
    );
    if (!procRows[0]) return res.status(404).json({ error: "Proceso no encontrado" });
    const proceso = procRows[0];

    const { rows: items } = await pool.query(
      `SELECT dr.id_detalle, dr.cantidad, dr.descripcion_libre, dr.observaciones,
              i.nombre AS insumo_nombre, i.codigo_insumo,
              um.nombre AS unidad_nombre, um.simbolo AS unidad_simbolo
         FROM detalle_requisicion dr
         LEFT JOIN insumo i ON i.id_insumo = dr.id_insumo
         JOIN unidad_medida um ON um.id_unidad_medida = dr.id_unidad_medida
        WHERE dr.id_requisicion = $1
        ORDER BY dr.id_detalle`,
      [proceso.id_requisicion],
    );

    const { rows: cotizaciones } = await pool.query(
      `SELECT c.id_cotizacion, c.id_proveedor, c.numero_cotizacion, c.referencia_proveedor,
              c.monto_total, c.condiciones_pago, c.tiempo_entrega_dias, c.tiempo_entrega_texto,
              c.estado_cotizacion, c.cumple_tecnico, c.seleccionada, c.motivo_rechazo,
              p.nit, p.razon_social
         FROM cotizacion c
         JOIN proveedor p ON p.id_proveedor = c.id_proveedor
        WHERE c.id_requisicion = $1
        ORDER BY c.id_cotizacion`,
      [proceso.id_requisicion],
    );

    const { rows: detalles } = await pool.query(
      `SELECT dc.id_cotizacion, dc.id_detalle_requisicion, dc.cantidad_cotizada,
              dc.precio_unitario, dc.subtotal, dc.descripcion_oferta
         FROM detalle_cotizacion dc
         JOIN cotizacion c ON c.id_cotizacion = dc.id_cotizacion
        WHERE c.id_requisicion = $1`,
      [proceso.id_requisicion],
    );

    // Matriz: por ítem, por proveedor -> precio unitario y subtotal
    const porProveedor = cotizaciones.map((cot) => {
      const det = detalles.filter((d) => d.id_cotizacion === cot.id_cotizacion);
      const itemMap = new Map(det.map((d) => [d.id_detalle_requisicion, d]));
      return {
        ...cot,
        items: items.map((it) => itemMap.get(it.id_detalle) ?? null),
      };
    });

    // Mejor precio por ítem
    const mejorPrecio = items.map((it) => {
      let min = null;
      for (const p of porProveedor) {
        const d = p.items.find((x) => x && x.id_detalle_requisicion === it.id_detalle);
        if (d && (min === null || Number(d.precio_unitario) < min)) min = Number(d.precio_unitario);
      }
      return min;
    });

    res.json({
      proceso,
      items,
      proveedores: porProveedor,
      mejorPrecio,
    });
  } catch (e) {
    next(e);
  }
});

// ── Seleccionar ganadora (provisional) ─────────────────────────────────────────
router.patch("/cotizaciones/:id/seleccionar", authorize("proformas"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM cotizacion WHERE id_cotizacion = $1",
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Cotización no encontrada" });

    await pool.query(
      "UPDATE cotizacion SET seleccionada = FALSE WHERE id_requisicion = $1",
      [rows[0].id_requisicion],
    );
    const { rows: upd } = await pool.query(
      "UPDATE cotizacion SET seleccionada = TRUE WHERE id_cotizacion = $1 RETURNING *",
      [req.params.id],
    );
    res.json(upd[0]);
  } catch (e) {
    next(e);
  }
});

// ── Notificaciones tras adjudicar ──────────────────────────────────────────────
async function notificarAdjudicacion(proceso, cotizacion, codigo) {
  const ganadorUsr = await pool.query(
    `SELECT pu.id_usuario FROM proveedor_usuario pu
      JOIN usuario u ON u.id_usuario = pu.id_usuario
     WHERE pu.id_proveedor = $1 AND u.activo = TRUE
     ORDER BY pu.es_principal DESC LIMIT 1`,
    [cotizacion.id_proveedor],
  );
  if (ganadorUsr.rows[0]) {
    await enviar({
      idUsuario: ganadorUsr.rows[0].id_usuario,
      tipo: "NUEVA_ORDEN",
      titulo: "Nueva orden de compra",
      mensaje: `Su cotización ${cotizacion.numero_cotizacion} fue adjudicada. Tiene una nueva orden de compra para la solicitud ${codigo}.`,
      referencia: codigo,
    });
  }

  const rechazados = await pool.query(
    `SELECT c.id_proveedor, c.numero_cotizacion
       FROM cotizacion c
      WHERE c.id_requisicion = $1 AND c.id_cotizacion <> $2`,
    [proceso.id_requisicion, cotizacion.id_cotizacion],
  );
  for (const r of rechazados.rows) {
    const usr = await pool.query(
      `SELECT pu.id_usuario FROM proveedor_usuario pu
        JOIN usuario u ON u.id_usuario = pu.id_usuario
       WHERE pu.id_proveedor = $1 AND u.activo = TRUE
       ORDER BY pu.es_principal DESC LIMIT 1`,
      [r.id_proveedor],
    );
    if (usr.rows[0]) {
      await enviar({
        idUsuario: usr.rows[0].id_usuario,
        tipo: "PROFORMA_RECHAZADA",
        titulo: "Proforma rechazada",
        mensaje: `Su proforma ${r.numero_cotizacion} fue rechazada en la solicitud ${codigo}.`,
        referencia: codigo,
      });
    }
  }
}

// ── Adjudicar (genera orden de compra) ─────────────────────────────────────────
router.post("/procesos/:id/adjudicar", authorize("proformas"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: procRows } = await client.query(
      "SELECT * FROM proceso_cotizacion WHERE id_proceso = $1 FOR UPDATE",
      [req.params.id],
    );
    const proceso = procRows[0];
    if (!proceso) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Proceso no encontrado" });
    }
    if (proceso.fase !== "Comparación" && proceso.fase !== "Publicada") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El proceso debe estar en fase Comparación para adjudicar" });
    }

    const { id_cotizacion, motivo_adjudicacion } = req.body;
    if (!id_cotizacion) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Seleccione la cotización ganadora" });
    }
    if (!motivo_adjudicacion || !motivo_adjudicacion.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El motivo de adjudicación es obligatorio" });
    }

    const cotRes = await client.query(
      "SELECT * FROM cotizacion WHERE id_cotizacion = $1 AND id_requisicion = $2",
      [id_cotizacion, proceso.id_requisicion],
    );
    const cotizacion = cotRes.rows[0];
    if (!cotizacion) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cotización no pertenece a este proceso" });
    }

    // Mínimo de ofertas
    const countRes = await client.query(
      "SELECT COUNT(*)::int AS total FROM cotizacion WHERE id_requisicion = $1 AND estado_cotizacion != 'Rechazada'",
      [proceso.id_requisicion],
    );
    if (countRes.rows[0].total < proceso.min_ofertas) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Se requiere un mínimo de ${proceso.min_ofertas} ofertas` });
    }

    // Validar presupuesto disponible (el monto se establece al cargar la factura)
    const reqRes = await client.query(
      "SELECT * FROM requisicion WHERE id_requisicion = $1",
      [proceso.id_requisicion],
    );
    const requisicion = reqRes.rows[0];

    // Marcar aceptada, generar orden de compra y actualizar proceso/requisición
    const orden = await adjudicarInterno(client, proceso, cotizacion, motivo_adjudicacion.trim(), req.user.id_usuario);

    await client.query("COMMIT");

    await notificarAdjudicacion(proceso, cotizacion, requisicion.codigo_requisicion);

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "adjudicacion",
      ip: ipDe(req),
      modulo: "Proformas",
      detalle: `Adjudicada ${requisicion.codigo_requisicion} → ${orden.numero_orden}`,
    });

    res.status(201).json({ orden, cotizacion: { ...cotizacion, estado_cotizacion: "Aceptada" } });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Adjudicación automática (mejor precio) ─────────────────────────────────────
router.post("/procesos/:id/auto-adjudicar", authorize("proformas"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: procRows } = await client.query(
      "SELECT * FROM proceso_cotizacion WHERE id_proceso = $1 FOR UPDATE",
      [req.params.id],
    );
    const proceso = procRows[0];
    if (!proceso) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Proceso no encontrado" });
    }
    if (proceso.fase !== "Comparación" && proceso.fase !== "Publicada") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El proceso debe estar en fase Publicada o Comparación" });
    }

    const reqRes = await client.query(
      "SELECT * FROM requisicion WHERE id_requisicion = $1",
      [proceso.id_requisicion],
    );
    const requisicion = reqRes.rows[0];

    const { rows: cotizaciones } = await client.query(
      `SELECT c.*, p.nit, p.razon_social
         FROM cotizacion c
         JOIN proveedor p ON p.id_proveedor = c.id_proveedor
        WHERE c.id_requisicion = $1
          AND c.estado_cotizacion != 'Rechazada'
        ORDER BY c.monto_total ASC`,
      [proceso.id_requisicion],
    );

    if (cotizaciones.length < proceso.min_ofertas) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `Se requiere un mínimo de ${proceso.min_ofertas} ofertas para adjudicar automáticamente`,
        total_ofertas: cotizaciones.length,
      });
    }

    // Solo se consideran las que cumplen el requisito técnico.
    const validas = cotizaciones.filter((c) => c.cumple_tecnico !== false);
    if (validas.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Ninguna oferta cumple los requisitos técnicos" });
    }

    const ganadora = validas[0];

    // Validar presupuesto disponible (el monto se establece al cargar la factura)
    const motivo = `Adjudicación automática por mejor precio: ${ganadora.razon_social} (${ganadora.nit})`;
    const orden = await adjudicarInterno(client, proceso, ganadora, motivo, req.user.id_usuario);

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "adjudicacion_automatica",
      ip: ipDe(req),
      modulo: "Proformas",
      detalle: `Adjudicación automática ${requisicion.codigo_requisicion} → ${orden.numero_orden} (${ganadora.razon_social})`,
    });

    res.status(201).json({
      orden,
      cotizacion: { ...ganadora, estado_cotizacion: "Aceptada" },
      analisis: {
        total_ofertas: cotizaciones.length,
        proveedor_ganador: ganadora.razon_social,
        nit: ganadora.nit,
        monto: ganadora.monto_total,
        motivo,
      },
    });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Declarar desierto ──────────────────────────────────────────────────────────
router.post("/procesos/:id/desierto", authorize("proformas"), async (req, res, next) => {
  try {
    const { motivo_adjudicacion } = req.body;
    if (!motivo_adjudicacion || !motivo_adjudicacion.trim()) {
      return res.status(400).json({ error: "El motivo es obligatorio" });
    }
    const { rows } = await pool.query(
      `UPDATE proceso_cotizacion
          SET fase = 'Desierta', motivo_adjudicacion = $1,
              id_usuario_adjudica = $2, fecha_adjudicacion = now()
        WHERE id_proceso = $3
        RETURNING *`,
      [motivo_adjudicacion.trim(), req.user.id_usuario, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Proceso no encontrado" });

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "proceso_desierto",
      ip: ipDe(req),
      modulo: "Proformas",
      detalle: `Proceso ${req.params.id} declarado desierto`,
    });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ── Órdenes de compra (adjudicadas) + procesos pendientes (2+ proveedores) ────
router.get("/ordenes-compra", authorize("proformas"), async (req, res, next) => {
  try {
    const { estado } = req.query;

    // Órdenes adjudicadas (a partir de una proforma; id_cotizacion NOT NULL).
    const where = ["oc.id_cotizacion IS NOT NULL"];
    const params = [];
    if (estado) {
      where.push(`oc.estado = $${params.length + 1}`);
      params.push(estado);
    }
    const { rows: ordenesRows } = await pool.query(
      `SELECT oc.*, r.codigo_requisicion, r.tipo_solicitud, r.justificacion,
              r.monto_estimado, p.nit, p.razon_social, d.nombre_dependencia,
              pc.id_proceso, pc.fase AS fase_proceso, pc.motivo_adjudicacion
         FROM orden_compra oc
         JOIN requisicion r ON r.id_requisicion = oc.id_requisicion
         JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
         LEFT JOIN proceso_cotizacion pc ON pc.id_requisicion = oc.id_requisicion
        WHERE ${where.join(" AND ")}
        ORDER BY oc.fecha_emision DESC, r.id_requisicion`,
      params,
    );

    // Procesos pendientes de adjudicar: 2+ invitados, fase Publicada/Comparación,
    // sin orden de compra adjudicada todavía.
    const { rows: procRows } = await pool.query(
      `SELECT pc.id_proceso, pc.id_requisicion, pc.fase, pc.fecha_publicacion,
              r.codigo_requisicion, r.tipo_solicitud, r.monto_estimado,
              d.nombre_dependencia
         FROM proceso_cotizacion pc
         JOIN requisicion r ON r.id_requisicion = pc.id_requisicion
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
        WHERE pc.fase IN ('Publicada', 'Comparación')
          AND (SELECT COUNT(*)::int FROM invitacion_proveedor ip WHERE ip.id_proceso = pc.id_proceso) >= 2
          AND NOT EXISTS (
                SELECT 1 FROM orden_compra oc
                 WHERE oc.id_requisicion = pc.id_requisicion AND oc.id_cotizacion IS NOT NULL
              )
        ORDER BY pc.fecha_publicacion DESC`,
    );

    // Invitados (con detalle de cotización) para todos los procesos involucrados.
    const idsProceso = [
      ...new Set(
        [...ordenesRows.map((r) => r.id_proceso), ...procRows.map((r) => r.id_proceso)].filter(Boolean),
      ),
    ];
    const invitadosPorProceso = new Map();
    if (idsProceso.length) {
      const { rows: inv } = await pool.query(
        `SELECT ip.id_proceso, ip.id_proveedor, p.nit, p.razon_social, p.correo, p.telefono,
                c.id_cotizacion, c.numero_cotizacion, c.fecha_cotizacion, c.condiciones_pago,
                c.tiempo_entrega_dias, c.tiempo_entrega_texto, c.estado_cotizacion,
                c.cumple_tecnico, c.seleccionada, c.monto_total
           FROM invitacion_proveedor ip
           JOIN proveedor p ON p.id_proveedor = ip.id_proveedor
           LEFT JOIN cotizacion c
                  ON c.id_requisicion = (SELECT id_requisicion FROM proceso_cotizacion WHERE id_proceso = ip.id_proceso)
                 AND c.id_proveedor = ip.id_proveedor
          WHERE ip.id_proceso = ANY($1::int[])
          ORDER BY p.razon_social`,
        [idsProceso],
      );

      const idsCot = inv.map((i) => i.id_cotizacion).filter(Boolean);
      const itemsPorCot = new Map();
      if (idsCot.length) {
        const { rows: dets } = await pool.query(
          `SELECT dc.id_cotizacion, dc.id_detalle_cotizacion, dc.id_detalle_requisicion,
                  dc.cantidad_cotizada, dc.precio_unitario, dc.subtotal, dc.descripcion_oferta,
                  dr.cantidad AS cantidad_solicitada, um.simbolo AS unidad_simbolo,
                  COALESCE(i.nombre, dr.descripcion_libre) AS descripcion
             FROM detalle_cotizacion dc
             JOIN detalle_requisicion dr ON dr.id_detalle = dc.id_detalle_requisicion
             JOIN unidad_medida um ON um.id_unidad_medida = dr.id_unidad_medida
             LEFT JOIN insumo i ON i.id_insumo = dr.id_insumo
            WHERE dc.id_cotizacion = ANY($1::int[])
            ORDER BY dc.id_cotizacion, dc.id_detalle_cotizacion`,
          [idsCot],
        );
        for (const d of dets) {
          if (!itemsPorCot.has(d.id_cotizacion)) itemsPorCot.set(d.id_cotizacion, []);
          itemsPorCot.get(d.id_cotizacion).push(d);
        }
      }

      for (const i of inv) {
        if (!invitadosPorProceso.has(i.id_proceso)) invitadosPorProceso.set(i.id_proceso, []);
        invitadosPorProceso.get(i.id_proceso).push({
          ...i,
          items: i.id_cotizacion ? itemsPorCot.get(i.id_cotizacion) ?? [] : [],
        });
      }
    }

    const ordenes = ordenesRows
      .map((r) => ({ tipo: "orden", ...r, invitados: invitadosPorProceso.get(r.id_proceso) ?? [] }))
      .filter((r) => r.invitados.length >= 2);

    const procesos = procRows
      .map((r) => ({
        tipo: "proceso",
        id_orden_compra: null,
        numero_orden: null,
        ...r,
        fase_proceso: r.fase,
        justificacion: null,
        monto_total: null,
        estado: null,
        fecha_emision: null,
        razon_social: null,
        nit: null,
        motivo_adjudicacion: null,
        invitados: invitadosPorProceso.get(r.id_proceso) ?? [],
      }))
      .filter((r) => r.invitados.length >= 2);

    res.json([...procesos, ...ordenes]);
  } catch (e) {
    next(e);
  }
});

// ── Detalle de orden de compra ─────────────────────────────────────────────────
router.get("/ordenes-compra/:id", authorize("proformas"), async (req, res, next) => {
  try {
    const { rows: ocRows } = await pool.query(
      `SELECT oc.*, r.codigo_requisicion, r.tipo_solicitud, r.justificacion, r.lugar_entrega,
              r.monto_estimado, p.nit, p.razon_social, p.correo, p.telefono, d.nombre_dependencia,
              pc.id_proceso, pc.fase AS fase_proceso, pc.motivo_adjudicacion
         FROM orden_compra oc
         JOIN requisicion r ON r.id_requisicion = oc.id_requisicion
         JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
         LEFT JOIN proceso_cotizacion pc ON pc.id_requisicion = oc.id_requisicion
        WHERE oc.id_orden_compra = $1 AND oc.id_cotizacion IS NOT NULL`,
      [req.params.id],
    );
    if (!ocRows[0]) return res.status(404).json({ error: "Orden de compra no encontrada" });
    const orden = ocRows[0];

    const { rows: items } = await pool.query(
      `SELECT doc.id_detalle_orden, doc.cantidad_comprada, doc.precio_unitario, doc.subtotal,
              COALESCE(i.nombre, dr.descripcion_libre) AS descripcion,
              um.simbolo AS unidad_simbolo
         FROM detalle_orden_compra doc
         JOIN detalle_requisicion dr ON dr.id_detalle = doc.id_detalle_requisicion
         JOIN unidad_medida um ON um.id_unidad_medida = dr.id_unidad_medida
         LEFT JOIN insumo i ON i.id_insumo = dr.id_insumo
        WHERE doc.id_orden_compra = $1
        ORDER BY doc.id_detalle_orden`,
      [orden.id_orden_compra],
    );

    let invitados = [];
    if (orden.id_proceso) {
      const { rows: inv } = await pool.query(
        `SELECT ip.id_proveedor, p.nit, p.razon_social, p.correo, p.telefono,
                c.id_cotizacion, c.numero_cotizacion, c.fecha_cotizacion, c.condiciones_pago,
                c.tiempo_entrega_dias, c.tiempo_entrega_texto, c.estado_cotizacion,
                c.cumple_tecnico, c.seleccionada, c.monto_total
           FROM invitacion_proveedor ip
           JOIN proveedor p ON p.id_proveedor = ip.id_proveedor
           LEFT JOIN cotizacion c ON c.id_requisicion = $2 AND c.id_proveedor = ip.id_proveedor
          WHERE ip.id_proceso = $1
          ORDER BY p.razon_social`,
        [orden.id_proceso, orden.id_requisicion],
      );

      const idsCot = inv.map((i) => i.id_cotizacion).filter(Boolean);
      const itemsPorCot = new Map();
      if (idsCot.length) {
        const { rows: dets } = await pool.query(
          `SELECT dc.id_cotizacion, dc.id_detalle_requisicion, dc.cantidad_cotizada,
                  dc.precio_unitario, dc.subtotal, dc.descripcion_oferta,
                  dr.cantidad AS cantidad_solicitada, um.simbolo AS unidad_simbolo,
                  COALESCE(i.nombre, dr.descripcion_libre) AS descripcion
             FROM detalle_cotizacion dc
             JOIN detalle_requisicion dr ON dr.id_detalle = dc.id_detalle_requisicion
             JOIN unidad_medida um ON um.id_unidad_medida = dr.id_unidad_medida
             LEFT JOIN insumo i ON i.id_insumo = dr.id_insumo
            WHERE dc.id_cotizacion = ANY($1::int[])
            ORDER BY dc.id_cotizacion, dc.id_detalle_cotizacion`,
          [idsCot],
        );
        for (const d of dets) {
          if (!itemsPorCot.has(d.id_cotizacion)) itemsPorCot.set(d.id_cotizacion, []);
          itemsPorCot.get(d.id_cotizacion).push(d);
        }
      }

      invitados = inv.map((i) => ({
        ...i,
        items: i.id_cotizacion ? itemsPorCot.get(i.id_cotizacion) ?? [] : [],
      }));
    }

    res.json({ ...orden, items, invitados });
  } catch (e) {
    next(e);
  }
});

router.patch("/ordenes-compra/:id/estado", authorize("proformas"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: cur } = await client.query(
      "SELECT * FROM orden_compra WHERE id_orden_compra = $1 FOR UPDATE",
      [req.params.id],
    );
    if (!cur[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Orden de compra no encontrada" });
    }
    const orden = cur[0];

    const { estado } = req.body;
    const validos = ["Pendiente", "Aprobada", "Enviada", "Entregada", "Cancelada"];
    if (!validos.includes(estado)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Estado inválido" });
    }

    // Separación de funciones: quien emite no aprueba.
    if (estado === "Aprobada" && orden.id_usuario_emite === req.user.id_usuario) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Quien emite la orden no puede aprobarla" });
    }

    const { rows } = await client.query(
      `UPDATE orden_compra
          SET estado = $1, id_usuario_aprobador = $2, fecha_aprobacion = $3
        WHERE id_orden_compra = $4
        RETURNING *`,
      [
        estado,
        estado === "Aprobada" ? req.user.id_usuario : orden.id_usuario_aprobador,
        estado === "Aprobada" ? new Date() : orden.fecha_aprobacion,
        req.params.id,
      ],
    );

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: `oc_${estado.toLowerCase()}`,
      ip: ipDe(req),
      modulo: "Proformas",
      detalle: `Orden ${orden.numero_orden}: ${orden.estado} → ${estado}`,
    });

    res.json(rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Proformas recibidas: listado global ─────────────────────────────────────────
router.get("/cotizaciones", authorize("proformas"), async (req, res, next) => {
  try {
    const { estado, id_proveedor, fecha_desde, fecha_hasta, q, page = 1, pageSize = 20 } = req.query;
    const where = ["1=1"];
    const params = [];
    const add = (v) => params.push(v);

    // Solo proformas de procesos enviados a un único proveedor (compra directa).
    where.push(`(SELECT COUNT(*)::int FROM invitacion_proveedor ip WHERE ip.id_proceso = pc.id_proceso) = 1`);

    if (estado) { where.push(`c.estado_cotizacion = $${params.length + 1}`); add(estado); }
    if (id_proveedor) { where.push(`c.id_proveedor = $${params.length + 1}`); add(id_proveedor); }
    if (fecha_desde) { where.push(`c.fecha_envio >= $${params.length + 1}`); add(fecha_desde); }
    if (fecha_hasta) { where.push(`c.fecha_envio <= $${params.length + 1}`); add(fecha_hasta); }
    if (q) {
      where.push(`(p.razon_social ILIKE $${params.length + 1} OR r.codigo_requisicion ILIKE $${params.length + 1} OR c.numero_cotizacion ILIKE $${params.length + 1})`);
      add(`%${q}%`);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;
    const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM cotizacion c
        JOIN proveedor p ON p.id_proveedor = c.id_proveedor
        JOIN requisicion r ON r.id_requisicion = c.id_requisicion
        JOIN proceso_cotizacion pc ON pc.id_requisicion = c.id_requisicion
       ${whereSql}`,
      params,
    );
    const total = countRes.rows[0].total;

    const { rows } = await pool.query(
      `SELECT c.id_cotizacion, c.numero_cotizacion, c.monto_total, c.estado_cotizacion,
              c.fecha_envio, c.origen, c.seleccionada,
              p.nit, p.razon_social,
              r.codigo_requisicion, r.tipo_solicitud,
              pc.id_proceso, pc.fase AS fase_proceso
         FROM cotizacion c
         JOIN proveedor p ON p.id_proveedor = c.id_proveedor
         JOIN requisicion r ON r.id_requisicion = c.id_requisicion
         JOIN proceso_cotizacion pc ON pc.id_requisicion = c.id_requisicion
        ${whereSql}
        ORDER BY c.fecha_envio DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(pageSize, 10), offset],
    );

    res.json({
      data: rows,
      total,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  } catch (e) {
    next(e);
  }
});

// ── Detalle de proforma recibida ───────────────────────────────────────────────
router.get("/cotizaciones/:id", authorize("proformas"), async (req, res, next) => {
  try {
    const { rows: cotRows } = await pool.query(
      `SELECT c.*, p.nit, p.razon_social, p.correo, p.telefono,
              r.codigo_requisicion, r.tipo_solicitud, r.justificacion, r.lugar_entrega,
              d.nombre_dependencia, pc.id_proceso, pc.fase AS fase_proceso
         FROM cotizacion c
         JOIN proveedor p ON p.id_proveedor = c.id_proveedor
         JOIN requisicion r ON r.id_requisicion = c.id_requisicion
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
         JOIN proceso_cotizacion pc ON pc.id_requisicion = c.id_requisicion
        WHERE c.id_cotizacion = $1`,
      [req.params.id],
    );
    if (!cotRows[0]) return res.status(404).json({ error: "Cotización no encontrada" });

    const { rows: items } = await pool.query(
      `SELECT dc.id_detalle_cotizacion, dc.id_detalle_requisicion,
              dc.cantidad_cotizada, dc.precio_unitario, dc.subtotal, dc.descripcion_oferta,
              dr.cantidad AS cantidad_solicitada, um.simbolo AS unidad_simbolo,
              COALESCE(i.nombre, dr.descripcion_libre) AS descripcion
         FROM detalle_cotizacion dc
         JOIN detalle_requisicion dr ON dr.id_detalle = dc.id_detalle_requisicion
         JOIN unidad_medida um ON um.id_unidad_medida = dr.id_unidad_medida
         LEFT JOIN insumo i ON i.id_insumo = dr.id_insumo
        WHERE dc.id_cotizacion = $1
        ORDER BY dc.id_detalle_cotizacion`,
      [req.params.id],
    );

    res.json({ ...cotRows[0], items });
  } catch (e) {
    next(e);
  }
});

// ── Cambiar estado de proforma ─────────────────────────────────────────────────
router.patch("/cotizaciones/:id/estado", authorize("proformas"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: cur } = await client.query(
      "SELECT * FROM cotizacion WHERE id_cotizacion = $1 FOR UPDATE",
      [req.params.id],
    );
    if (!cur[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    const { estado, observaciones } = req.body;
    const validos = ["Recibida", "En Evaluación", "Aceptada", "Rechazada"];
    if (!validos.includes(estado)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Estado inválido" });
    }

    const transicionesValidas = {
      "Recibida": ["En Evaluación", "Rechazada"],
      "En Evaluación": ["Aceptada", "Rechazada"],
      "Aceptada": [],
      "Rechazada": [],
    };
    if (!transicionesValidas[cur[0].estado_cotizacion].includes(estado)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `No se puede cambiar de ${cur[0].estado_cotizacion} a ${estado}` });
    }

    const { rows } = await client.query(
      `UPDATE cotizacion
          SET estado_cotizacion = $1, observaciones_tecnicas = COALESCE($2, observaciones_tecnicas)
        WHERE id_cotizacion = $3
        RETURNING *`,
      [estado, observaciones ?? null, req.params.id],
    );

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: `cotizacion_${estado.toLowerCase().replace(/\s+/g, "_")}`,
      ip: ipDe(req),
      modulo: "Proformas",
      detalle: `Cotización ${cur[0].numero_cotizacion}: ${cur[0].estado_cotizacion} → ${estado}`,
    });

    res.json(rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

export default router;
