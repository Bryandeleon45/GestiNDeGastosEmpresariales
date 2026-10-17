import { Router } from "express";
import PDFDocument from "pdfkit";
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
        WHERE ip.id_proveedor = $1
          AND pc.min_ofertas > 1`,
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
          AND pc.min_ofertas > 1
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
  const client = await pool.connect();
  try {
    const idProv = req.proveedor.id_proveedor;
    const { rows: entregas } = await client.query(
      `SELECT rb.id_recepcion, rb.numero_comprobante, rb.fecha_recepcion, rb.estado, rb.observaciones,
              oc.numero_orden, oc.id_orden_compra,
              b.nombre_bodega, b.ubicacion, b.encargado,
              e.nombre AS recibe_nombre, e.apellido AS recibe_apellido,
              d.nombre_dependencia
         FROM recepcion_bodega rb
         JOIN orden_compra oc ON oc.id_orden_compra = rb.id_orden_compra
         JOIN bodega b ON b.id_bodega = rb.id_bodega
         LEFT JOIN usuario u ON u.id_usuario = rb.id_usuario
         LEFT JOIN empleado e ON e.id_empleado = u.id_empleado
         JOIN requisicion r ON r.id_requisicion = oc.id_requisicion
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
        WHERE oc.id_proveedor = $1
        ORDER BY rb.fecha_recepcion DESC`,
      [idProv],
    );

    const resultado = [];
    for (const e of entregas) {
      const { rows: items } = await client.query(
        `SELECT drb.id_detalle_recepcion, drb.id_detalle_orden,
                COALESCE(i.nombre, doc.descripcion_libre) AS descripcion,
                drb.cantidad_esperada, drb.cantidad_recibida, drb.cantidad_aceptada,
                drb.estado_item, drb.observacion, um.simbolo AS unidad_simbolo
           FROM detalle_recepcion_bodega drb
           JOIN detalle_orden_compra doc ON doc.id_detalle_orden = drb.id_detalle_orden
           LEFT JOIN insumo i ON i.id_insumo = drb.id_insumo
           JOIN unidad_medida um ON um.id_unidad_medida = doc.id_unidad_medida
          WHERE drb.id_recepcion = $1
          ORDER BY drb.id_detalle_recepcion`,
        [e.id_recepcion],
      );

      resultado.push({
        id_recepcion: e.id_recepcion,
        numero_comprobante: e.numero_comprobante,
        fecha_recepcion: e.fecha_recepcion,
        estado: e.estado,
        observaciones: e.observaciones,
        numero_orden: e.numero_orden,
        id_orden_compra: e.id_orden_compra,
        nombre_bodega: e.nombre_bodega,
        ubicacion: e.ubicacion,
        encargado: e.encargado,
        recibido_por: e.recibe_nombre ? `${e.recibe_nombre} ${e.recibe_apellido ?? ""}`.trim() : null,
        nombre_dependencia: e.nombre_dependencia,
        total_items: items.length,
        items: items.map((it) => ({
          id_detalle_recepcion: it.id_detalle_recepcion,
          descripcion: it.descripcion,
          cantidad_esperada: Number(it.cantidad_esperada),
          cantidad_recibida: Number(it.cantidad_recibida),
          cantidad_aceptada: Number(it.cantidad_aceptada),
          estado_item: it.estado_item,
          observacion: it.observacion,
          unidad_simbolo: it.unidad_simbolo,
        })),
      });
    }

    res.json(resultado);
  } catch (e) {
    next(e);
  } finally {
    client.release();
  }
});

// ── Pedidos asignados (asignación directa de requisiciones aprobadas) ────────
router.get("/pedidos-asignados", resolveProveedor, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const idProv = req.proveedor.id_proveedor;

    const { rows: pedidos } = await client.query(
      `SELECT r.id_requisicion, r.codigo_requisicion, r.tipo_solicitud, r.prioridad,
              r.justificacion, r.lugar_entrega, r.fecha_solicitud, r.estado, r.monto_estimado,
              d.nombre_dependencia, pc.fecha_publicacion AS fecha_asignacion,
              oc.id_orden_compra, oc.numero_orden, oc.estado AS estado_orden,
              (SELECT COUNT(*)::int FROM recepcion_bodega
                WHERE id_orden_compra = oc.id_orden_compra AND estado <> 'Cancelada') AS total_recepciones,
              (SELECT COUNT(*)::int FROM recepcion_bodega
                WHERE id_orden_compra = oc.id_orden_compra AND estado = 'Completa') AS recepciones_completas
         FROM proceso_cotizacion pc
         JOIN invitacion_proveedor ip ON ip.id_proceso = pc.id_proceso
         JOIN requisicion r ON r.id_requisicion = pc.id_requisicion
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
         LEFT JOIN orden_compra oc ON oc.id_requisicion = r.id_requisicion AND oc.id_proveedor = $1
        WHERE ip.id_proveedor = $1
        ORDER BY pc.fecha_publicacion DESC`,
      [idProv],
    );

    const resultado = [];
    for (const p of pedidos) {
      const { rows: items } = await client.query(
        `SELECT dr.id_detalle,
                COALESCE(i.nombre, dr.descripcion_libre) AS descripcion,
                dr.cantidad, um.simbolo AS unidad, dr.observaciones
           FROM detalle_requisicion dr
           LEFT JOIN insumo i ON i.id_insumo = dr.id_insumo
           JOIN unidad_medida um ON um.id_unidad_medida = dr.id_unidad_medida
          WHERE dr.id_requisicion = $1
          ORDER BY dr.id_detalle`,
        [p.id_requisicion],
      );

      const { rows: docs } = await client.query(
        `SELECT nombre_archivo, contenido_base64
           FROM requisicion_imagen
          WHERE id_requisicion = $1
          ORDER BY id_imagen`,
        [p.id_requisicion],
      );

      let estadoEntrega = "Asignado";
      if (p.recepciones_completas > 0 || p.estado_orden === "Entregada") estadoEntrega = "Entregado";
      else if (p.total_recepciones > 0) estadoEntrega = "Entrega Parcial";

      resultado.push({
        id_requisicion: p.id_requisicion,
        codigo_requisicion: p.codigo_requisicion,
        tipo_solicitud: p.tipo_solicitud,
        prioridad: p.prioridad,
        justificacion: p.justificacion,
        dependencia: p.nombre_dependencia,
        lugar_entrega: p.lugar_entrega,
        fecha_solicitud: p.fecha_solicitud,
        fecha_asignacion: p.fecha_asignacion,
        estado: estadoEntrega,
        monto_estimado: p.monto_estimado,
        estado_orden: p.estado_orden || null,
        numero_orden: p.numero_orden || null,
        items: items.map((it) => ({
          id_detalle: it.id_detalle,
          descripcion: it.descripcion,
          cantidad: String(it.cantidad),
          unidad: it.unidad,
          observaciones: it.observaciones,
        })),
        documentos: docs.map((d) => ({
          nombre_archivo: d.nombre_archivo,
          contenido_base64: d.contenido_base64,
        })),
      });
    }

    res.json(resultado);
  } catch (e) {
    next(e);
  } finally {
    client.release();
  }
});

// ── Órdenes de compra facturables del proveedor ────────────────────────────────
router.get("/ordenes-facturables", resolveProveedor, async (req, res, next) => {
  try {
    const idProv = req.proveedor.id_proveedor;
    const { rows } = await pool.query(
      `SELECT oc.id_orden_compra, oc.numero_orden, oc.fecha_emision, oc.monto_total, oc.estado,
              r.codigo_requisicion, r.tipo_solicitud,
              COALESCE((SELECT SUM(f.monto_total) FROM factura f
                         WHERE f.id_orden_compra = oc.id_orden_compra AND f.estado <> 'Rechazada'), 0)::numeric(12,2) AS total_facturado,
              COALESCE((SELECT monto_recibido FROM v_recibido_oc
                         WHERE id_orden_compra = oc.id_orden_compra), 0)::numeric(12,2) AS recibido_valorizado
         FROM orden_compra oc
         JOIN requisicion r ON r.id_requisicion = oc.id_requisicion
        WHERE oc.id_proveedor = $1
          AND oc.estado IN ('Aprobada','Enviada','Entregada')
        ORDER BY oc.fecha_emision DESC`,
      [idProv],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Detalle de una orden facturable del proveedor (con sus ítems) ──────────────
router.get("/ordenes-facturables/:id", resolveProveedor, async (req, res, next) => {
  try {
    const idProv = req.proveedor.id_proveedor;
    const { rows } = await pool.query(
      `SELECT oc.id_orden_compra, oc.numero_orden, oc.fecha_emision, oc.monto_total, oc.estado,
              r.codigo_requisicion, r.tipo_solicitud, r.justificacion, r.lugar_entrega,
              d.nombre_dependencia,
              COALESCE((SELECT SUM(f.monto_total) FROM factura f
                         WHERE f.id_orden_compra = oc.id_orden_compra AND f.estado <> 'Rechazada'), 0)::numeric(12,2) AS total_facturado,
              COALESCE((SELECT monto_recibido FROM v_recibido_oc
                         WHERE id_orden_compra = oc.id_orden_compra), 0)::numeric(12,2) AS recibido_valorizado
         FROM orden_compra oc
         JOIN requisicion r ON r.id_requisicion = oc.id_requisicion
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
        WHERE oc.id_orden_compra = $1 AND oc.id_proveedor = $2`,
      [req.params.id, idProv],
    );
    if (!rows[0]) return res.status(404).json({ error: "Orden no encontrada" });

    const { rows: items } = await pool.query(
      `SELECT doc.id_detalle_orden,
              COALESCE(i.nombre, dr.descripcion_libre) AS descripcion,
              doc.cantidad_comprada, doc.precio_unitario,
              (doc.cantidad_comprada * doc.precio_unitario)::numeric(12,2) AS subtotal,
              um.simbolo AS unidad_simbolo,
              COALESCE((SELECT SUM(drb.cantidad_aceptada)
                          FROM detalle_recepcion_bodega drb
                          JOIN recepcion_bodega rb ON rb.id_recepcion = drb.id_recepcion
                         WHERE drb.id_detalle_orden = doc.id_detalle_orden
                           AND rb.estado IN ('Completa','Parcial','Con Novedades')), 0) AS cantidad_recibida
         FROM detalle_orden_compra doc
         JOIN detalle_requisicion dr ON dr.id_detalle = doc.id_detalle_requisicion
         LEFT JOIN insumo i ON i.id_insumo = dr.id_insumo
         JOIN unidad_medida um ON um.id_unidad_medida = dr.id_unidad_medida
        WHERE doc.id_orden_compra = $1
        ORDER BY doc.id_detalle_orden`,
      [req.params.id],
    );

    res.json({ ...rows[0], items });
  } catch (e) {
    next(e);
  }
});
router.get("/facturas", resolveProveedor, async (req, res, next) => {
  try {
    const idProv = req.proveedor.id_proveedor;
    const { rows } = await pool.query(
      `SELECT f.id_factura, f.numero_factura, f.serie, f.fecha_emision, f.monto_total,
              f.estado, f.fecha_registro, f.observaciones,
              oc.numero_orden, oc.id_orden_compra,
              r.codigo_requisicion
         FROM factura f
         JOIN orden_compra oc ON oc.id_orden_compra = f.id_orden_compra
         JOIN requisicion r ON r.id_requisicion = oc.id_requisicion
        WHERE f.id_proveedor = $1
        ORDER BY f.fecha_registro DESC`,
      [idProv],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Registrar factura desde el portal del proveedor ───────────────────────────
router.post("/facturas", resolveProveedor, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      id_orden_compra,
      serie,
      numero_factura,
      numero_autorizacion,
      npg,
      fecha_emision,
      monto_total,
      plazo_credito_dias,
      observaciones,
      archivo_pdf_nombre,
      archivo_pdf_base64,
      archivo_xml_nombre,
      archivo_xml_base64,
    } = req.body;

    if (!id_orden_compra) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La orden de compra es requerida" });
    }
    if (!numero_factura || !numero_factura.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El número de factura es requerido" });
    }
    if (!fecha_emision) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La fecha de emisión es requerida" });
    }
    if (!(parseFloat(monto_total) > 0)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El monto debe ser mayor que 0" });
    }

    const idProv = req.proveedor.id_proveedor;

    const ocRes = await client.query(
      "SELECT * FROM orden_compra WHERE id_orden_compra = $1 AND id_proveedor = $2 FOR UPDATE",
      [id_orden_compra, idProv],
    );
    const oc = ocRes.rows[0];
    if (!oc) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Orden de compra no encontrada o no pertenece a su proveedor" });
    }
    if (!["Aprobada", "Enviada", "Entregada"].includes(oc.estado)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La orden de compra debe estar Aprobada o posterior" });
    }

    const dup = await client.query(
      `SELECT 1 FROM factura WHERE id_proveedor = $1 AND serie IS NOT DISTINCT FROM $2 AND numero_factura = $3`,
      [idProv, serie || null, numero_factura.trim()],
    );
    if (dup.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Ya existe una factura con esa serie y número" });
    }

    const facturadoRes = await client.query(
      "SELECT COALESCE(SUM(monto_total), 0) AS total FROM factura WHERE id_orden_compra = $1 AND estado <> 'Rechazada'",
      [id_orden_compra],
    );
    const recepcionRes = await client.query(
      `SELECT 1 FROM recepcion_bodega rb
         JOIN detalle_recepcion_bodega drb ON drb.id_recepcion = rb.id_recepcion
        WHERE rb.id_orden_compra = $1
          AND rb.estado IN ('Completa','Parcial','Con Novedades')
          AND drb.cantidad_aceptada > 0
        LIMIT 1`,
      [id_orden_compra],
    );
    const facturado = parseFloat(facturadoRes.rows[0].total);
    const nuevo = parseFloat(monto_total);
    if (!recepcionRes.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(422).json({ error: "No hay recepción de bodega registrada para esta orden de compra" });
    }
    const limite = parseFloat(oc.monto_total) || 0;
    if (limite > 0 && facturado + nuevo > limite + 0.001) {
      await client.query("ROLLBACK");
      return res.status(422).json({
        error: "El monto facturado supera el monto de la orden de compra",
        disponible: (limite - facturado).toFixed(2),
      });
    }

    const plazo = plazo_credito_dias != null ? parseInt(plazo_credito_dias, 10) : (oc.plazo_credito_dias ?? 0);
    const fechaVenc = new Date(fecha_emision);
    fechaVenc.setDate(fechaVenc.getDate() + plazo);

    const { rows: factRows } = await client.query(
      `INSERT INTO factura
         (id_orden_compra, id_proveedor, serie, numero_factura, numero_autorizacion, npg,
          fecha_emision, monto_total, plazo_credito_dias, fecha_vencimiento,
          observaciones, origen, archivo_pdf_nombre, archivo_pdf_base64,
          archivo_xml_nombre, archivo_xml_base64, id_usuario_registra)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PORTAL',$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        id_orden_compra,
        idProv,
        serie || null,
        numero_factura.trim(),
        numero_autorizacion || null,
        npg || null,
        fecha_emision,
        nuevo.toFixed(2),
        plazo,
        fechaVenc.toISOString().slice(0, 10),
        observaciones || null,
        archivo_pdf_nombre || null,
        archivo_pdf_base64 || null,
        archivo_xml_nombre || null,
        archivo_xml_base64 || null,
        req.user.id_usuario,
      ],
    );

    // El monto de la factura es la fuente del monto del sistema: se copia a la
    // orden y a la solicitud (la orden solo se actualiza si estaba en 0).
    if (parseFloat(oc.monto_total) === 0) {
      await client.query(
        "UPDATE orden_compra SET monto_total = $1 WHERE id_orden_compra = $2",
        [nuevo.toFixed(2), id_orden_compra],
      );
    }
    const ocAct = await client.query("SELECT * FROM orden_compra WHERE id_orden_compra = $1", [id_orden_compra]);
    await client.query(
      `UPDATE requisicion
          SET monto_adjudicado = $1,
              monto_estimado = CASE WHEN monto_estimado = 0 THEN $1 ELSE monto_estimado END
        WHERE id_requisicion = $2`,
      [ocAct.rows[0].monto_total, oc.id_requisicion],
    );

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "factura_portal_registrada",
      ip: ipDe(req),
      modulo: "Facturación",
      detalle: `Factura ${numero_factura} registrada desde portal para ${oc.numero_orden}`,
    });

    res.status(201).json(factRows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Informe consolidado: solicitudes pagadas y recibidas en bodega ────────────
const INFORME_COLUMNAS = [
  { campo: "codigo_requisicion", titulo: "Solicitud" },
  { campo: "dependencia", titulo: "Dependencia" },
  { campo: "tipo_solicitud", titulo: "Tipo" },
  { campo: "numero_orden", titulo: "Orden" },
  { campo: "monto_orden", titulo: "Monto" },
  { campo: "recibido_valorizado", titulo: "Recibido" },
  { campo: "estado_recepcion", titulo: "Est. Recepción" },
  { campo: "facturado", titulo: "Facturado" },
  { campo: "estado_factura", titulo: "Est. Factura" },
  { campo: "pagado", titulo: "Pagado" },
  { campo: "estado_pago", titulo: "Est. Pago" },
  { campo: "fecha_pago", titulo: "Fecha Pago" },
];

function fechaValor(v) {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function estadoInforme(f) {
  if (f.pagada && f.recibida_en_bodega) return "Pagada y recibida";
  if (f.pagada) return "Pagada";
  if (f.facturado) return "Pendiente de pago";
  return "Pendiente de factura";
}

async function obtenerInformeProveedor(idProveedor, { fechaInicio, fechaFin, q } = {}) {
  const where = ["oc.id_proveedor = $1"];
  const params = [idProveedor];
  if (fechaInicio) {
    where.push(`oc.fecha_emision >= $${params.length + 1}`);
    params.push(fechaInicio);
  }
  if (fechaFin) {
    where.push(`oc.fecha_emision < $${params.length + 1}::date + 1`);
    params.push(fechaFin);
  }
  if (q) {
    where.push(`(r.codigo_requisicion ILIKE $${params.length + 1} OR oc.numero_orden ILIKE $${params.length + 1})`);
    params.push(`%${q}%`);
  }

  const { rows } = await pool.query(
    `SELECT oc.id_orden_compra, oc.numero_orden, oc.fecha_emision, oc.monto_total,
            oc.estado AS estado_orden,
            r.codigo_requisicion, r.tipo_solicitud,
            d.nombre_dependencia,
            COALESCE((SELECT monto_recibido FROM v_recibido_oc
                       WHERE id_orden_compra = oc.id_orden_compra), 0)::numeric(12,2) AS recibido_valorizado,
            (SELECT MAX(rb.fecha_recepcion)
               FROM recepcion_bodega rb
              WHERE rb.id_orden_compra = oc.id_orden_compra
                AND rb.estado IN ('Completa','Parcial','Con Novedades')) AS fecha_recepcion,
            (SELECT rb.estado
               FROM recepcion_bodega rb
              WHERE rb.id_orden_compra = oc.id_orden_compra
                AND rb.estado IN ('Completa','Parcial','Con Novedades')
              ORDER BY rb.fecha_recepcion DESC, rb.id_recepcion DESC LIMIT 1) AS estado_recepcion,
            COALESCE((SELECT SUM(f.monto_total)
                        FROM factura f
                       WHERE f.id_orden_compra = oc.id_orden_compra
                         AND f.estado <> 'Rechazada'), 0)::numeric(12,2) AS facturado,
            (SELECT f.estado
               FROM factura f
              WHERE f.id_orden_compra = oc.id_orden_compra AND f.estado <> 'Rechazada'
              ORDER BY f.id_factura DESC LIMIT 1) AS estado_factura,
            COALESCE((SELECT SUM(op.monto)
                        FROM factura f
                        JOIN orden_pago op ON op.id_factura = f.id_factura
                       WHERE f.id_orden_compra = oc.id_orden_compra
                         AND op.estado = 'Pagada'), 0)::numeric(12,2) AS pagado,
            (SELECT op.estado
               FROM factura f
               JOIN orden_pago op ON op.id_factura = f.id_factura
              WHERE f.id_orden_compra = oc.id_orden_compra AND op.estado <> 'Anulada'
              ORDER BY op.id_orden_pago DESC LIMIT 1) AS estado_pago,
            (SELECT MAX(op.fecha_pago_real)
               FROM factura f
               JOIN orden_pago op ON op.id_factura = f.id_factura
              WHERE f.id_orden_compra = oc.id_orden_compra AND op.estado = 'Pagada') AS fecha_pago
       FROM orden_compra oc
       JOIN requisicion r ON r.id_requisicion = oc.id_requisicion
       JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
      WHERE ${where.join(" AND ")}
      ORDER BY oc.fecha_emision DESC, oc.id_orden_compra DESC`,
    params,
  );

  return rows.map((r) => {
    const recibida = Number(r.recibido_valorizado) > 0;
    const pagada = Number(r.pagado) > 0;
    const facturado = Number(r.facturado) > 0;
    return {
      id_orden_compra: r.id_orden_compra,
      codigo_requisicion: r.codigo_requisicion,
      dependencia: r.nombre_dependencia,
      tipo_solicitud: r.tipo_solicitud,
      numero_orden: r.numero_orden,
      fecha_emision: r.fecha_emision,
      monto_orden: r.monto_total,
      estado_orden: r.estado_orden,
      recibido_valorizado: r.recibido_valorizado,
      estado_recepcion: r.estado_recepcion,
      fecha_recepcion: fechaValor(r.fecha_recepcion),
      facturado: r.facturado,
      estado_factura: r.estado_factura,
      pagado: r.pagado,
      estado_pago: r.estado_pago,
      fecha_pago: fechaValor(r.fecha_pago),
      pagada: pagada,
      recibida_en_bodega: recibida,
      estado: estadoInforme({ pagada, recibida_en_bodega: recibida, facturado }),
    };
  });
}

function filtrarInforme(filas, estado) {
  if (!estado || estado === "todas") return filas;
  if (estado === "pagadas") return filas.filter((f) => f.pagada);
  if (estado === "pendientes") return filas.filter((f) => f.estado === "Pendiente de pago");
  if (estado === "recibidas") return filas.filter((f) => f.recibida_en_bodega);
  return filas;
}

function calcularTotales(filas) {
  const sum = (k) => filas.reduce((s, f) => s + Number(f[k] || 0), 0);
  return {
    ordenes: filas.length,
    monto_orden: sum("monto_orden").toFixed(2),
    recibido: sum("recibido_valorizado").toFixed(2),
    facturado: sum("facturado").toFixed(2),
    pagado: sum("pagado").toFixed(2),
    pendientes: filas.filter((f) => f.estado === "Pendiente de pago").length,
  };
}

function buildInformeCsv(filas) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    INFORME_COLUMNAS.map((c) => esc(c.titulo)).join(","),
    ...filas.map((f) =>
      INFORME_COLUMNAS.map((c) => esc(f[c.campo] ?? "")).join(","),
    ),
  ].join("\n");
}

function buildInformePdf(proveedor, filas, totales) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const trunc = (v, n) => {
      const s = String(v ?? "—");
      return s.length > n ? `${s.slice(0, n - 1)}…` : s;
    };
    const cols = [
      { k: "codigo_requisicion", t: "Solicitud", w: 95 },
      { k: "dependencia", t: "Dependencia", w: 100 },
      { k: "numero_orden", t: "Orden", w: 90 },
      { k: "monto_orden", t: "Monto", w: 62, right: true },
      { k: "recibido_valorizado", t: "Recibido", w: 62, right: true },
      { k: "pagado", t: "Pagado", w: 62, right: true },
      { k: "estado", t: "Estado", w: 160 },
    ];
    const x0 = 40;
    const ancho = cols.reduce((s, c) => s + c.w, 0);
    const rowH = 20;
    const headerH = 24;

    doc.fontSize(16).fillColor("#1E5E2F").text("Informe de Solicitudes — Pagadas y Recibidas en Bodega");
    doc.fontSize(10).fillColor("#333333").text(`Proveedor: ${proveedor.razon_social}  ·  NIT: ${proveedor.nit}`);
    doc.fontSize(9).fillColor("#666666").text(`Generado: ${new Date().toLocaleString("es-GT")}`);
    doc.moveDown(0.6);

    let y = doc.y;
    doc.rect(x0, y, ancho, headerH).fill("#1E5E2F");
    let x = x0;
    doc.fontSize(8).fillColor("#FFFFFF");
    for (const c of cols) {
      doc.text(c.t.toUpperCase(), x + 4, y + 8, { width: c.w - 8, align: c.right ? "right" : "left" });
      x += c.w;
    }
    y += headerH;

    doc.fontSize(8);
    filas.forEach((f, i) => {
      if (y + rowH > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }
      if (i % 2 === 0) doc.rect(x0, y, ancho, rowH).fill("#F3F4F6");
      x = x0;
      for (const c of cols) {
        const val = c.k === "estado" ? f.estado : c.right ? f[c.k] : trunc(f[c.k], c.k === "dependencia" ? 16 : 22);
        doc.fillColor("#222222").text(String(val), x + 4, y + 6, { width: c.w - 8, align: c.right ? "right" : "left" });
        x += c.w;
      }
      y += rowH;
    });

    y += 8;
    doc.fontSize(9).fillColor("#1E5E2F").text(
      `Totales — Órdenes: ${totales.ordenes} · Monto: Q ${totales.monto_orden} · Recibido: Q ${totales.recibido} · Facturado: Q ${totales.facturado} · Pagado: Q ${totales.pagado} · Pendientes: ${totales.pendientes}`,
      x0,
      y,
    );

    doc.end();
  });
}

router.get("/informe", resolveProveedor, async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin, estado, q } = req.query;
    const filas = await obtenerInformeProveedor(req.proveedor.id_proveedor, { fechaInicio, fechaFin, q });
    const filtradas = filtrarInforme(filas, estado);

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "portal_informe",
      ip: ipDe(req),
      modulo: "Portal",
      detalle: "Consulta de informe de solicitudes pagadas y recibidas",
    });

    res.json({
      filas: filtradas,
      totales: calcularTotales(filtradas),
      proveedor: { razon_social: req.proveedor.razon_social, nit: req.proveedor.nit },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/informe/exportar", resolveProveedor, async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin, estado, q, formato } = req.query;
    const filas = await obtenerInformeProveedor(req.proveedor.id_proveedor, { fechaInicio, fechaFin, q });
    const filtradas = filtrarInforme(filas, estado);
    const totales = calcularTotales(filtradas);
    const proveedor = { razon_social: req.proveedor.razon_social, nit: req.proveedor.nit };

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "portal_informe_exportar",
      ip: ipDe(req),
      modulo: "Portal",
      detalle: `Exportación de informe (${formato === "pdf" ? "PDF" : "CSV"})`,
    });

    if (formato === "pdf") {
      const buf = await buildInformePdf(proveedor, filtradas, totales);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="informe_solicitudes.pdf"');
      return res.send(buf);
    }

    const csv = buildInformeCsv(filtradas);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="informe_solicitudes.csv"');
    return res.send(csv);
  } catch (e) {
    next(e);
  }
});

export default router;
