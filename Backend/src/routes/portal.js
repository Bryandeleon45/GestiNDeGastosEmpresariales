import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

router.use(authenticate);

// ── Resuelve el proveedor asociado al usuario autenticado ─────────────────────
async function resolveProveedor(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT p.id_proveedor, p.nit, p.razon_social, p.correo, p.telefono,
              p.direccion, p.activo AS proveedor_activo, p.representante_legal,
              p.nombre_contacto, p.telefono_contacto
         FROM proveedor_usuario pu
         JOIN proveedor p ON p.id_proveedor = pu.id_proveedor
        WHERE pu.id_usuario = $1
        ORDER BY pu.es_principal DESC
        LIMIT 1`,
      [req.user.id_usuario],
    );
    if (!rows[0]) {
      return res.status(403).json({ error: "El usuario no está vinculado a un proveedor" });
    }
    req.proveedor = rows[0];
    next();
  } catch (e) {
    next(e);
  }
}

async function nextNumero(prefix, table, column, client) {
  const anio = new Date().getFullYear();
  const { rows } = await client.query(
    `SELECT COALESCE(MAX(SPLIT_PART(${column}, '-', 3)::int), 0) + 1 AS siguiente
       FROM ${table}
      WHERE ${column} LIKE '${prefix}-' || $1 || '-%'`,
    [anio],
  );
  return `${prefix}-${anio}-${String(rows[0].siguiente).padStart(3, "0")}`;
}

// Deriva el estado de la oportunidad desde la perspectiva del proveedor.
function estadoOportunidad(fila) {
  const fase = fila.fase;
  const invEstado = fila.estado_invitacion;
  const cotEstado = fila.estado_cotizacion;
  const fechaLimite = fila.fecha_limite ? new Date(fila.fecha_limite) : null;
  const ahora = new Date();

  if (fase === "Desierta") return "Cancelada";
  if (invEstado === "Declinó") return "Declinada";
  if (cotEstado === "Aceptada") return "Adjudicada";
  if (cotEstado === "Rechazada") return "No adjudicada";
  if (fase === "Adjudicada" && cotEstado && cotEstado !== "Aceptada") return "No adjudicada";
  if (cotEstado === "Recibida" || cotEstado === "En Evaluación") return "Cotizada";

  if (fase === "Publicada" && fechaLimite && fechaLimite > ahora) {
    return fila.fecha_vista ? "Abierta" : "Nueva";
  }
  if (fase === "Publicada") return "Vencida";
  if (cotEstado === "Retirada") return "Cerrada";
  return "Cerrada";
}

// ── Perfil del proveedor autenticado ──────────────────────────────────────────
router.get("/perfil", resolveProveedor, async (req, res) => {
  res.json({
    ...req.proveedor,
    nombre_usuario: req.user.nombre_usuario,
    correo_usuario: req.user.correo,
    nombre_completo: req.user.nombre_completo,
  });
});

// ── Resumen (KPIs del portal) ─────────────────────────────────────────────────
router.get("/resumen", resolveProveedor, async (req, res, next) => {
  try {
    const idProv = req.proveedor.id_proveedor;
    const { rows: inv } = await pool.query(
      `SELECT ip.fecha_vista, ip.estado AS estado_invitacion, pc.fase,
              pc.fecha_limite, c.estado_cotizacion
         FROM invitacion_proveedor ip
         JOIN proceso_cotizacion pc ON pc.id_proceso = ip.id_proceso
         LEFT JOIN cotizacion c ON c.id_requisicion = pc.id_requisicion
                              AND c.id_proveedor = ip.id_proveedor
                              AND c.estado_cotizacion <> 'Retirada'
        WHERE ip.id_proveedor = $1`,
      [idProv],
    );

    let abiertas = 0;
    let porVencer = 0;
    let cotizadas = 0;
    let adjudicadas = 0;
    const ahora = new Date();

    for (const f of inv) {
      const e = estadoOportunidad(f);
      const lim = f.fecha_limite ? new Date(f.fecha_limite) : null;
      if (e === "Nueva" || e === "Abierta") {
        abiertas++;
        if (lim && lim.getTime() - ahora.getTime() <= 48 * 3600 * 1000) porVencer++;
      }
      if (e === "Cotizada") cotizadas++;
      if (e === "Adjudicada") adjudicadas++;
    }

    const { rows: monto } = await pool.query(
      `SELECT COALESCE(SUM(c.monto_total), 0)::numeric(12,2) AS total
         FROM cotizacion c
         JOIN proceso_cotizacion pc ON pc.id_requisicion = c.id_requisicion
        WHERE c.id_proveedor = $1 AND c.estado_cotizacion = 'Aceptada'`,
      [idProv],
    );

    const { rows: facturas } = await pool.query(
      `SELECT COUNT(*)::int AS pendientes
         FROM factura f
        WHERE f.id_proveedor = $1
          AND f.estado IN ('Recibida','En Revisión','Aprobada')
          AND NOT EXISTS (
            SELECT 1 FROM orden_pago op
             WHERE op.id_factura = f.id_factura AND op.estado = 'Pagada'
          )`,
      [idProv],
    );

    const { rows: ordenes } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM orden_compra WHERE id_proveedor = $1`,
      [idProv],
    );

    res.json({
      abiertas,
      por_vencer: porVencer,
      cotizaciones_enviadas: cotizadas,
      en_evaluacion: cotizadas,
      adjudicadas,
      monto_ejecucion: monto[0]?.total ?? "0.00",
      facturas_pendientes: facturas[0]?.pendientes ?? 0,
      ordenes: ordenes[0]?.total ?? 0,
    });
  } catch (e) {
    next(e);
  }
});

// ── Listado de oportunidades ──────────────────────────────────────────────────
router.get("/oportunidades", resolveProveedor, async (req, res, next) => {
  try {
    const idProv = req.proveedor.id_proveedor;
    const { tab = "abiertas", q } = req.query;
    const { rows } = await pool.query(
      `SELECT ip.id_invitacion, ip.fecha_invitacion, ip.fecha_vista,
              ip.estado AS estado_invitacion, ip.motivo_declina,
              pc.id_proceso, pc.fase, pc.fecha_publicacion, pc.fecha_limite,
              r.id_requisicion, r.codigo_requisicion, r.tipo_solicitud,
              r.prioridad, r.monto_estimado, r.justificacion,
              d.nombre_dependencia, d.siglas,
              c.id_cotizacion, c.numero_cotizacion, c.monto_total,
              c.estado_cotizacion, c.fecha_envio
         FROM invitacion_proveedor ip
         JOIN proceso_cotizacion pc ON pc.id_proceso = ip.id_proceso
         JOIN requisicion r ON r.id_requisicion = pc.id_requisicion
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
         LEFT JOIN cotizacion c ON c.id_requisicion = pc.id_requisicion
                              AND c.id_proveedor = ip.id_proveedor
                              AND c.estado_cotizacion <> 'Retirada'
        WHERE ip.id_proveedor = $1
        ORDER BY pc.fecha_publicacion DESC`,
      [idProv],
    );

    const list = rows.map((r) => ({
      id_proceso: r.id_proceso,
      id_requisicion: r.id_requisicion,
      codigo_requisicion: r.codigo_requisicion,
      tipo_solicitud: r.tipo_solicitud,
      prioridad: r.prioridad,
      monto_estimado: r.monto_estimado,
      justificacion: r.justificacion,
      dependencia: r.nombre_dependencia,
      siglas: r.siglas,
      fase: r.fase,
      fecha_publicacion: r.fecha_publicacion,
      fecha_limite: r.fecha_limite,
      fecha_vista: r.fecha_vista,
      id_cotizacion: r.id_cotizacion,
      numero_cotizacion: r.numero_cotizacion,
      monto_total: r.monto_total,
      estado_cotizacion: r.estado_cotizacion,
      estado: estadoOportunidad({
        fase: r.fase,
        estado_invitacion: r.estado_invitacion,
        estado_cotizacion: r.estado_cotizacion,
        fecha_limite: r.fecha_limite,
        fecha_vista: r.fecha_vista,
      }),
    }));

    const filtrado = list.filter((r) => {
      if (q) {
        const s = String(q).toLowerCase();
        if (
          !r.codigo_requisicion.toLowerCase().includes(s) &&
          !(r.tipo_solicitud || "").toLowerCase().includes(s) &&
          !(r.dependencia || "").toLowerCase().includes(s)
        ) {
          return false;
        }
      }
      switch (tab) {
        case "abiertas":
          return ["Nueva", "Abierta"].includes(r.estado);
        case "cotizadas":
          return ["Cotizada"].includes(r.estado);
        case "adjudicadas":
          return ["Adjudicada"].includes(r.estado);
        case "historial":
          return ["No adjudicada", "Vencida", "Cerrada", "Cancelada", "Declinada"].includes(r.estado);
        default:
          return true;
      }
    });

    res.json(filtrado);
  } catch (e) {
    next(e);
  }
});

// ── Detalle de oportunidad ────────────────────────────────────────────────────
router.get("/oportunidades/:id", resolveProveedor, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const idProv = req.proveedor.id_proveedor;
    const idProceso = req.params.id;

    const { rows: invRows } = await client.query(
      `SELECT ip.*, pc.*, r.*, d.nombre_dependencia, d.siglas
         FROM invitacion_proveedor ip
         JOIN proceso_cotizacion pc ON pc.id_proceso = ip.id_proceso
         JOIN requisicion r ON r.id_requisicion = pc.id_requisicion
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
        WHERE ip.id_proceso = $1 AND ip.id_proveedor = $2`,
      [idProceso, idProv],
    );
    if (!invRows[0]) return res.status(404).json({ error: "Oportunidad no encontrada" });
    const base = invRows[0];

    // Marca la primera vista.
    if (!base.fecha_vista) {
      await client.query(
        "UPDATE invitacion_proveedor SET fecha_vista = now() WHERE id_invitacion = $1",
        [base.id_invitacion],
      );
    }

    const { rows: items } = await client.query(
      `SELECT dr.id_detalle, dr.id_requisicion, dr.id_insumo, dr.descripcion_libre,
              dr.id_unidad_medida, dr.cantidad, dr.observaciones,
              i.nombre AS insumo_nombre, i.codigo_insumo,
              um.nombre AS unidad_nombre, um.simbolo AS unidad_simbolo
         FROM detalle_requisicion dr
         LEFT JOIN insumo i ON i.id_insumo = dr.id_insumo
         JOIN unidad_medida um ON um.id_unidad_medida = dr.id_unidad_medida
        WHERE dr.id_requisicion = $1
        ORDER BY dr.id_detalle`,
      [base.id_requisicion],
    );

    const { rows: cotRows } = await client.query(
      `SELECT * FROM cotizacion
        WHERE id_requisicion = $1 AND id_proveedor = $2 AND estado_cotizacion <> 'Retirada'`,
      [base.id_requisicion, idProv],
    );
    const cotizacion = cotRows[0] ?? null;

    let detalleCotizacion = [];
    if (cotizacion) {
      const { rows: dc } = await client.query(
        `SELECT dc.id_detalle_cotizacion, dc.id_detalle_requisicion,
                dc.cantidad_cotizada, dc.precio_unitario, dc.subtotal, dc.descripcion_oferta
           FROM detalle_cotizacion dc
          WHERE dc.id_cotizacion = $1
          ORDER BY dc.id_detalle_cotizacion`,
        [cotizacion.id_cotizacion],
      );
      detalleCotizacion = dc;
    }

    res.json({
      id_proceso: base.id_proceso,
      id_requisicion: base.id_requisicion,
      codigo_requisicion: base.codigo_requisicion,
      tipo_solicitud: base.tipo_solicitud,
      prioridad: base.prioridad,
      justificacion: base.justificacion,
      lugar_entrega: base.lugar_entrega,
      monto_estimado: base.monto_estimado,
      dependencia: base.nombre_dependencia,
      siglas: base.siglas,
      fase: base.fase,
      fecha_publicacion: base.fecha_publicacion,
      fecha_limite: base.fecha_limite,
      min_ofertas: base.min_ofertas,
      motivo_adjudicacion: base.motivo_adjudicacion,
      estado_invitacion: base.estado,
      motivo_declina: base.motivo_declina,
      items,
      cotizacion: cotizacion
        ? { ...cotizacion, items: detalleCotizacion }
        : null,
      estado: estadoOportunidad({
        fase: base.fase,
        estado_invitacion: base.estado,
        estado_cotizacion: cotizacion?.estado_cotizacion ?? null,
        fecha_limite: base.fecha_limite,
        fecha_vista: base.fecha_vista,
      }),
    });
  } catch (e) {
    next(e);
  } finally {
    client.release();
  }
});

// ── Guardar borrador de cotización ────────────────────────────────────────────
router.put("/oportunidades/:id/cotizacion", resolveProveedor, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const idProv = req.proveedor.id_proveedor;
    const idProceso = req.params.id;

    const { condiciones_pago, tiempo_entrega_dias, tiempo_entrega_texto, referencia_proveedor, items } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "Debe incluir al menos un ítem" });
    }

    const { rows: invRows } = await client.query(
      `SELECT ip.id_invitacion, ip.estado AS estado_invitacion, pc.fase, pc.fecha_limite, pc.id_requisicion
         FROM invitacion_proveedor ip
         JOIN proceso_cotizacion pc ON pc.id_proceso = ip.id_proceso
        WHERE ip.id_proceso = $1 AND ip.id_proveedor = $2`,
      [idProceso, idProv],
    );
    const inv = invRows[0];
    if (!inv) return res.status(404).json({ error: "Oportunidad no encontrada" });
    if (inv.fase !== "Publicada") return res.status(409).json({ error: "La oportunidad ya no está abierta" });
    if (inv.estado_invitacion === "Declinó") return res.status(409).json({ error: "Usted declinó esta oportunidad" });
    if (new Date(inv.fecha_limite) <= new Date()) return res.status(410).json({ error: "El plazo para cotizar venció" });

    await client.query("BEGIN");

    // Cotización vigente (borrador) o nueva.
    let { rows: cotRows } = await client.query(
      `SELECT * FROM cotizacion WHERE id_requisicion = $1 AND id_proveedor = $2`,
      [inv.id_requisicion, idProv],
    );
    let cotizacion = cotRows[0];
    if (cotizacion && cotizacion.estado_cotizacion !== "Borrador") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Ya envió una cotización para esta oportunidad" });
    }
    if (!cotizacion) {
      const numero = await nextNumero("COT", "cotizacion", "numero_cotizacion", client);
      const insert = await client.query(
        `INSERT INTO cotizacion
           (id_requisicion, id_proveedor, numero_cotizacion, referencia_proveedor,
            condiciones_pago, tiempo_entrega_dias, tiempo_entrega_texto, origen, id_usuario_registra, estado_cotizacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PORTAL', $8, 'Borrador')
         RETURNING *`,
        [
          inv.id_requisicion, idProv, numero,
          referencia_proveedor ?? null, condiciones_pago ?? null,
          tiempo_entrega_dias ?? null, tiempo_entrega_texto ?? null, req.user.id_usuario,
        ],
      );
      cotizacion = insert.rows[0];
    } else {
      await client.query(
        `UPDATE cotizacion
            SET referencia_proveedor = $1, condiciones_pago = $2,
                tiempo_entrega_dias = $3, tiempo_entrega_texto = $4
          WHERE id_cotizacion = $5`,
        [
          referencia_proveedor ?? null, condiciones_pago ?? null,
          tiempo_entrega_dias ?? null, tiempo_entrega_texto ?? null, cotizacion.id_cotizacion,
        ],
      );
    }

    await client.query("DELETE FROM detalle_cotizacion WHERE id_cotizacion = $1", [cotizacion.id_cotizacion]);

    let monto = 0;
    for (const it of items) {
      const precio = parseFloat(it.precio_unitario);
      if (!Number.isFinite(precio) || precio <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "El precio unitario debe ser mayor a cero" });
      }
      const detRes = await client.query(
        `SELECT cantidad FROM detalle_requisicion
          WHERE id_detalle = $1 AND id_requisicion = $2`,
        [it.id_detalle_requisicion, inv.id_requisicion],
      );
      if (!detRes.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Ítem inválido para esta oportunidad" });
      }
      const cantidad = parseFloat(detRes.rows[0].cantidad);
      monto += cantidad * precio;
      await client.query(
        `INSERT INTO detalle_cotizacion
           (id_cotizacion, id_detalle_requisicion, cantidad_cotizada, precio_unitario, descripcion_oferta)
         VALUES ($1, $2, $3, $4, $5)`,
        [cotizacion.id_cotizacion, it.id_detalle_requisicion, cantidad, precio.toFixed(2), it.descripcion_oferta ?? null],
      );
    }

    await client.query("UPDATE cotizacion SET monto_total = $1 WHERE id_cotizacion = $2", [monto.toFixed(2), cotizacion.id_cotizacion]);

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "portal_cotizacion_borrador",
      ip: ipDe(req),
      modulo: "Portal",
      detalle: `Borrador de cotización guardado (proceso ${idProceso})`,
    });

    const { rows: det } = await client.query(
      "SELECT id_detalle_requisicion, cantidad_cotizada, precio_unitario, subtotal FROM detalle_cotizacion WHERE id_cotizacion = $1 ORDER BY id_detalle_cotizacion",
      [cotizacion.id_cotizacion],
    );
    res.json({ id_cotizacion: cotizacion.id_cotizacion, monto_total: monto.toFixed(2), items: det });
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505") return res.status(409).json({ error: "Ya existe una cotización para esta oportunidad" });
    next(e);
  } finally {
    client.release();
  }
});

// ── Enviar cotización ─────────────────────────────────────────────────────────
router.post("/oportunidades/:id/cotizacion/enviar", resolveProveedor, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const idProv = req.proveedor.id_proveedor;
    const idProceso = req.params.id;

    const { rows: invRows } = await client.query(
      `SELECT ip.id_invitacion, ip.estado AS estado_invitacion, pc.fase, pc.fecha_limite, pc.id_requisicion
         FROM invitacion_proveedor ip
         JOIN proceso_cotizacion pc ON pc.id_proceso = ip.id_proceso
        WHERE ip.id_proceso = $1 AND ip.id_proveedor = $2`,
      [idProceso, idProv],
    );
    const inv = invRows[0];
    if (!inv) return res.status(404).json({ error: "Oportunidad no encontrada" });
    if (inv.fase !== "Publicada") return res.status(409).json({ error: "La oportunidad ya no está abierta" });
    if (inv.estado_invitacion === "Declinó") return res.status(409).json({ error: "Usted declinó esta oportunidad" });
    if (new Date(inv.fecha_limite) <= new Date()) return res.status(410).json({ error: "El plazo para cotizar venció" });

    await client.query("BEGIN");

    const { rows: cotRows } = await client.query(
      `SELECT * FROM cotizacion
        WHERE id_requisicion = $1 AND id_proveedor = $2
        FOR UPDATE`,
      [inv.id_requisicion, idProv],
    );
    const cotizacion = cotRows[0];
    if (!cotizacion) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "No hay borrador. Guarde su cotización antes de enviarla" });
    }
    if (cotizacion.estado_cotizacion !== "Borrador") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "La cotización ya fue enviada" });
    }

    if (!cotizacion.condiciones_pago) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Las condiciones de pago son obligatorias" });
    }
    if (cotizacion.tiempo_entrega_dias == null && !cotizacion.tiempo_entrega_texto) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El tiempo de entrega es obligatorio" });
    }

    const { rows: det } = await client.query(
      "SELECT COUNT(*)::int AS total FROM detalle_cotizacion WHERE id_cotizacion = $1",
      [cotizacion.id_cotizacion],
    );
    if (!det[0] || det[0].total === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Debe cotizar todos los ítems" });
    }

    await client.query(
      "UPDATE cotizacion SET estado_cotizacion = 'Recibida', fecha_envio = now() WHERE id_cotizacion = $1",
      [cotizacion.id_cotizacion],
    );

    await client.query(
      `INSERT INTO notificacion (id_usuario, tipo, titulo, mensaje, referencia)
       VALUES ($1, 'COTIZACION_RECIBIDA', 'Cotización enviada',
               'Su cotización ' || $2 || ' fue recibida y quedó en evaluación.', $3)`,
      [req.user.id_usuario, cotizacion.numero_cotizacion, idProceso],
    );

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "portal_cotizacion_enviada",
      ip: ipDe(req),
      modulo: "Portal",
      detalle: `Cotización ${cotizacion.numero_cotizacion} enviada`,
    });

    res.json({
      constancia: `Su cotización ${cotizacion.numero_cotizacion} fue enviada correctamente.`,
      numero_cotizacion: cotizacion.numero_cotizacion,
      monto_total: cotizacion.monto_total,
    });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Retirar cotización ────────────────────────────────────────────────────────
router.post("/oportunidades/:id/cotizacion/retirar", resolveProveedor, async (req, res, next) => {
  try {
    const idProv = req.proveedor.id_proveedor;
    const { rows: invRows } = await pool.query(
      `SELECT pc.fase, pc.fecha_limite, pc.id_requisicion
         FROM invitacion_proveedor ip
         JOIN proceso_cotizacion pc ON pc.id_proceso = ip.id_proceso
        WHERE ip.id_proceso = $1 AND ip.id_proveedor = $2`,
      [req.params.id, idProv],
    );
    const inv = invRows[0];
    if (!inv) return res.status(404).json({ error: "Oportunidad no encontrada" });
    if (new Date(inv.fecha_limite) <= new Date()) return res.status(410).json({ error: "El plazo para retirar venció" });

    const { rows } = await pool.query(
      `UPDATE cotizacion SET estado_cotizacion = 'Retirada'
        WHERE id_requisicion = $1 AND id_proveedor = $2 AND estado_cotizacion = 'Recibida'
        RETURNING id_cotizacion`,
      [inv.id_requisicion, idProv],
    );
    if (!rows[0]) return res.status(409).json({ error: "No hay una cotización enviada que retirar" });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ── Declinar oportunidad ──────────────────────────────────────────────────────
router.post("/oportunidades/:id/declinar", resolveProveedor, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const idProv = req.proveedor.id_proveedor;
    const { motivo } = req.body;

    await client.query("BEGIN");

    const { rows: invRows } = await client.query(
      `SELECT ip.id_invitacion, pc.fase, pc.fecha_limite, pc.id_requisicion
         FROM invitacion_proveedor ip
         JOIN proceso_cotizacion pc ON pc.id_proceso = ip.id_proceso
        WHERE ip.id_proceso = $1 AND ip.id_proveedor = $2
        FOR UPDATE OF ip`,
      [req.params.id, idProv],
    );
    const inv = invRows[0];
    if (!inv) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Oportunidad no encontrada" });
    }
    if (new Date(inv.fecha_limite) <= new Date()) {
      await client.query("ROLLBACK");
      return res.status(410).json({ error: "El plazo para declinar venció" });
    }

    await client.query(
      "UPDATE invitacion_proveedor SET estado = 'Declinó', motivo_declina = $1, fecha_declina = now() WHERE id_invitacion = $2",
      [motivo?.trim() || null, inv.id_invitacion],
    );

    // Si existía un borrador, se retira.
    await client.query(
      `UPDATE cotizacion SET estado_cotizacion = 'Retirada'
        WHERE id_requisicion = $1 AND id_proveedor = $2 AND estado_cotizacion = 'Borrador'`,
      [inv.id_requisicion, idProv],
    );

    await client.query("COMMIT");

    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Documentos (adjuntos de la proforma) ──────────────────────────────────────
router.post("/cotizaciones/:id/documentos", resolveProveedor, async (req, res, next) => {
  try {
    const idProv = req.proveedor.id_proveedor;
    const { rows: cotRows } = await pool.query(
      "SELECT * FROM cotizacion WHERE id_cotizacion = $1 AND id_proveedor = $2",
      [req.params.id, idProv],
    );
    const cotizacion = cotRows[0];
    if (!cotizacion) return res.status(404).json({ error: "Cotización no encontrada" });
    if (cotizacion.estado_cotizacion !== "Borrador") {
      return res.status(409).json({ error: "Solo se pueden adjuntar documentos a un borrador" });
    }

    const { nombre_archivo, mime_type, contenido_base64 } = req.body;
    if (!nombre_archivo || !contenido_base64) {
      return res.status(400).json({ error: "nombre_archivo y contenido_base64 son requeridos" });
    }
    if (Buffer.byteLength(contenido_base64, "utf8") > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "El archivo no debe superar 10 MB" });
    }

    const { rows } = await pool.query(
      `INSERT INTO documento_cotizacion (id_cotizacion, nombre_archivo, mime_type, contenido_base64)
       VALUES ($1, $2, $3, $4) RETURNING id_documento, nombre_archivo, mime_type, fecha_carga`,
      [cotizacion.id_cotizacion, nombre_archivo, mime_type ?? "application/octet-stream", contenido_base64],
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.get("/cotizaciones/:id/documentos", resolveProveedor, async (req, res, next) => {
  try {
    const idProv = req.proveedor.id_proveedor;
    const { rows } = await pool.query(
      `SELECT d.id_documento, d.nombre_archivo, d.mime_type, d.fecha_carga,
              (d.contenido_base64 IS NOT NULL) AS tiene_contenido
         FROM documento_cotizacion d
         JOIN cotizacion c ON c.id_cotizacion = d.id_cotizacion
        WHERE d.id_cotizacion = $1 AND c.id_proveedor = $2
        ORDER BY d.id_documento`,
      [req.params.id, idProv],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Notificaciones ────────────────────────────────────────────────────────────
router.get("/notificaciones", resolveProveedor, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_notificacion, tipo, titulo, mensaje, referencia, leida, fecha
         FROM notificacion
        WHERE id_usuario = $1
        ORDER BY fecha DESC
        LIMIT 30`,
      [req.user.id_usuario],
    );
    const noLeidas = rows.filter((r) => !r.leida).length;
    res.json({ data: rows, no_leidas: noLeidas });
  } catch (e) {
    next(e);
  }
});

router.patch("/notificaciones/:id/leida", resolveProveedor, async (req, res, next) => {
  try {
    await pool.query(
      "UPDATE notificacion SET leida = TRUE WHERE id_notificacion = $1 AND id_usuario = $2",
      [req.params.id, req.user.id_usuario],
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ── Órdenes de compra del proveedor ───────────────────────────────────────────
router.get("/ordenes", resolveProveedor, async (req, res, next) => {
  try {
    const idProv = req.proveedor.id_proveedor;
    const { rows } = await pool.query(
      `SELECT oc.id_orden_compra, oc.numero_orden, oc.fecha_emision,
              oc.fecha_entrega_estimada, oc.monto_total, oc.estado,
              r.codigo_requisicion, r.tipo_solicitud,
              COALESCE((SELECT SUM(f.monto_total) FROM factura f
                         WHERE f.id_orden_compra = oc.id_orden_compra AND f.estado <> 'Rechazada'), 0)::numeric(12,2) AS total_facturado
         FROM orden_compra oc
         JOIN requisicion r ON r.id_requisicion = oc.id_requisicion
        WHERE oc.id_proveedor = $1
        ORDER BY oc.fecha_emision DESC`,
      [idProv],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Entregas en bodega del proveedor ──────────────────────────────────────────
router.get("/entregas", resolveProveedor, async (req, res, next) => {
  try {
    const idProv = req.proveedor.id_proveedor;
    const { rows } = await pool.query(
      `SELECT rb.id_recepcion, rb.numero_comprobante, rb.fecha_recepcion, rb.estado, rb.observaciones,
              oc.numero_orden, oc.id_orden_compra,
              (SELECT COUNT(*)::int FROM detalle_recepcion_bodega drb WHERE drb.id_recepcion = rb.id_recepcion) AS total_items
         FROM recepcion_bodega rb
         JOIN orden_compra oc ON oc.id_orden_compra = rb.id_orden_compra
        WHERE oc.id_proveedor = $1
        ORDER BY rb.fecha_recepcion DESC`,
      [idProv],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
