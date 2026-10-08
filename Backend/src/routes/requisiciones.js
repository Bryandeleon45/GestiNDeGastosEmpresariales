import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

router.use(authenticate);

// Roles que pueden ver y gestionar solicitudes de todas las dependencias.
const ROLES_GLOBALES = [
  "Administrador General",
  "Encargado de Compras",
  "Encargado de Almacén",
  "DAFIM",
  "Alcalde Municipal",
];

function esGlobal(user) {
  return ROLES_GLOBALES.includes(user.rol);
}

async function dependenciaDeUsuario(id_usuario) {
  const { rows } = await pool.query(
    `SELECT e.id_dependencia
       FROM usuario u
       JOIN empleado e ON e.id_empleado = u.id_empleado
      WHERE u.id_usuario = $1`,
    [id_usuario],
  );
  return rows[0]?.id_dependencia ?? null;
}

async function periodoActivo() {
  const { rows } = await pool.query(
    "SELECT id_periodo, anio FROM periodo_fiscal WHERE activo = TRUE LIMIT 1",
  );
  return rows[0] ?? null;
}

async function nextCodigo(anio, client) {
  const { rows } = await client.query(
    `SELECT COALESCE(MAX(SPLIT_PART(codigo_requisicion, '-', 3)::int), 0) + 1 AS siguiente
       FROM requisicion
      WHERE codigo_requisicion LIKE 'SC-' || $1 || '-%'`,
    [anio],
  );
  return `SC-${anio}-${String(rows[0].siguiente).padStart(3, "0")}`;
}

function montoDeItems(items) {
  return items.reduce((acc, item) => {
    const cantidad = parseFloat(item.cantidad) || 0;
    const precio = parseFloat(item.precio_estimado) || 0;
    return acc + cantidad * precio;
  }, 0);
}

// ── Listado maestro ───────────────────────────────────────────────────────────
router.get("/", authorize("solicitudes"), async (req, res, next) => {
  try {
    const { dependencia, estado, prioridad, desde, hasta, q, page = 1, pageSize = 12 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);

    const where = ["1=1"];
    const params = [];
    const add = (v) => params.push(v);

    if (dependencia) { where.push(`r.id_dependencia = $${params.length + 1}`); add(dependencia); }
    if (estado) { where.push(`r.estado = $${params.length + 1}`); add(estado); }
    if (prioridad) { where.push(`r.prioridad = $${params.length + 1}`); add(prioridad); }
    if (desde) { where.push(`r.fecha_solicitud >= $${params.length + 1}`); add(desde); }
    if (hasta) { where.push(`r.fecha_solicitud <= $${params.length + 1}`); add(hasta); }
    if (q) { where.push(`(r.codigo_requisicion ILIKE $${params.length + 1} OR r.justificacion ILIKE $${params.length + 1})`); add(`%${q}%`); }

    if (!esGlobal(req.user)) {
      const dep = await dependenciaDeUsuario(req.user.id_usuario);
      where.push(`r.id_dependencia = $${params.length + 1}`);
      add(dep);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM requisicion r ${whereSql}`,
      params,
    );
    const total = countRes.rows[0].total;

    const dataRes = await pool.query(
      `SELECT r.*, d.nombre_dependencia, d.siglas,
              u.nombre_usuario, e.nombre AS usuario_nombre, e.apellido AS usuario_apellido,
              pf.anio AS periodo_anio,
              (SELECT COUNT(*)::int FROM detalle_requisicion dr2 WHERE dr2.id_requisicion = r.id_requisicion) AS total_items,
              (SELECT COALESCE(i.nombre, dr2.descripcion_libre)
                 FROM detalle_requisicion dr2
                 LEFT JOIN insumo i ON i.id_insumo = dr2.id_insumo
                WHERE dr2.id_requisicion = r.id_requisicion
                ORDER BY dr2.id_detalle LIMIT 1) AS item_nombre,
              (SELECT dr2.cantidad
                 FROM detalle_requisicion dr2
                WHERE dr2.id_requisicion = r.id_requisicion
                ORDER BY dr2.id_detalle LIMIT 1) AS item_cantidad,
              (SELECT um.simbolo
                 FROM detalle_requisicion dr2
                 JOIN unidad_medida um ON um.id_unidad_medida = dr2.id_unidad_medida
                WHERE dr2.id_requisicion = r.id_requisicion
                ORDER BY dr2.id_detalle LIMIT 1) AS item_unidad,
              (SELECT pc.id_proceso FROM proceso_cotizacion pc WHERE pc.id_requisicion = r.id_requisicion LIMIT 1) AS id_proceso,
              (SELECT pc.fase FROM proceso_cotizacion pc WHERE pc.id_requisicion = r.id_requisicion LIMIT 1) AS fase_proceso,
              (SELECT oc.numero_orden FROM orden_compra oc WHERE oc.id_requisicion = r.id_requisicion LIMIT 1) AS numero_orden
         FROM requisicion r
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
         JOIN usuario u ON u.id_usuario = r.id_usuario
         JOIN empleado e ON e.id_empleado = u.id_empleado
         JOIN periodo_fiscal pf ON pf.id_periodo = r.id_periodo
        ${whereSql}
        ORDER BY r.fecha_solicitud DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(pageSize, 10), offset],
    );

    res.json({
      data: dataRes.rows,
      total,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  } catch (e) {
    next(e);
  }
});

// ── Resumen (KPIs) ────────────────────────────────────────────────────────────
router.get("/resumen", authorize("solicitudes"), async (req, res, next) => {
  try {
    const { dependencia, desde, hasta } = req.query;
    const where = ["1=1"];
    const params = [];
    const add = (v) => params.push(v);

    if (dependencia) { where.push(`r.id_dependencia = $${params.length + 1}`); add(dependencia); }
    if (desde) { where.push(`r.fecha_solicitud >= $${params.length + 1}`); add(desde); }
    if (hasta) { where.push(`r.fecha_solicitud <= $${params.length + 1}`); add(hasta); }

    if (!esGlobal(req.user)) {
      const dep = await dependenciaDeUsuario(req.user.id_usuario);
      where.push(`r.id_dependencia = $${params.length + 1}`);
      add(dep);
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE r.estado = 'Pendiente')::int AS pendientes,
         COUNT(*) FILTER (WHERE r.estado = 'En Revisión')::int AS en_revision,
         COUNT(*) FILTER (WHERE r.estado = 'Aprobada')::int AS aprobadas,
         COUNT(*) FILTER (WHERE r.estado = 'Rechazada')::int AS rechazadas,
         COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (now() - r.fecha_solicitud))/86400) FILTER (WHERE r.estado = 'Pendiente'))::numeric, 0) AS promedio_dias_pendientes,
         COALESCE(SUM(r.monto_estimado) FILTER (WHERE r.fecha_solicitud >= date_trunc('month', now())), 0)::numeric(12,2) AS monto_mes_actual
        FROM requisicion r
        WHERE ${where.join(" AND ")}`,
      params,
    );
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ── Exportar CSV ──────────────────────────────────────────────────────────────
router.get("/exportar", authorize("solicitudes"), async (req, res, next) => {
  try {
    const { dependencia, estado, prioridad, desde, hasta, q } = req.query;
    const where = ["1=1"];
    const params = [];
    const add = (v) => params.push(v);

    if (dependencia) { where.push(`r.id_dependencia = $${params.length + 1}`); add(dependencia); }
    if (estado) { where.push(`r.estado = $${params.length + 1}`); add(estado); }
    if (prioridad) { where.push(`r.prioridad = $${params.length + 1}`); add(prioridad); }
    if (desde) { where.push(`r.fecha_solicitud >= $${params.length + 1}`); add(desde); }
    if (hasta) { where.push(`r.fecha_solicitud <= $${params.length + 1}`); add(hasta); }
    if (q) { where.push(`(r.codigo_requisicion ILIKE $${params.length + 1} OR r.justificacion ILIKE $${params.length + 1})`); add(`%${q}%`); }

    if (!esGlobal(req.user)) {
      const dep = await dependenciaDeUsuario(req.user.id_usuario);
      where.push(`r.id_dependencia = $${params.length + 1}`);
      add(dep);
    }

    const { rows } = await pool.query(
      `SELECT r.codigo_requisicion, d.nombre_dependencia, r.tipo_solicitud, r.justificacion,
              r.lugar_entrega, r.prioridad, r.estado, r.monto_estimado,
              r.fecha_solicitud, r.fecha_resolucion,
              u.nombre_usuario, e.nombre AS solicitante_nombre, e.apellido AS solicitante_apellido
         FROM requisicion r
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
         JOIN usuario u ON u.id_usuario = r.id_usuario
         JOIN empleado e ON e.id_empleado = u.id_empleado
        WHERE ${where.join(" AND ")}
        ORDER BY r.fecha_solicitud DESC`,
      params,
    );

    const headers = [
      "codigo", "dependencia", "tipo", "justificacion", "lugar_entrega",
      "prioridad", "estado", "monto_estimado", "fecha_solicitud",
      "fecha_resolucion", "usuario", "solicitante",
    ];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => esc(r[h]))
          .join(","),
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=requisiciones.csv");
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

// ── Catálogos auxiliares ─────────────────────────────────────────────────────
router.get("/tipos-solicitud", (_req, res) => {
  res.json(["Compra de Materiales", "Servicio Técnico", "Equipamiento", "Mantenimiento"]);
});

router.get("/periodo-activo", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_periodo, anio FROM periodo_fiscal WHERE activo = TRUE LIMIT 1",
    );
    res.json({ activo: rows.length > 0, periodo: rows[0] ?? null });
  } catch (e) {
    next(e);
  }
});

router.get("/unidades-medida", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_unidad_medida, nombre, simbolo FROM unidad_medida WHERE activo = TRUE ORDER BY nombre",
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get("/insumos", async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const { rows } = await pool.query(
      `SELECT i.id_insumo, i.codigo_insumo, i.nombre, i.descripcion, i.precio_referencial,
              i.id_unidad_medida, um.nombre AS unidad_nombre, um.simbolo AS unidad_simbolo
         FROM insumo i
         JOIN unidad_medida um ON um.id_unidad_medida = i.id_unidad_medida
        WHERE i.activo = TRUE AND (i.nombre ILIKE $1 OR i.codigo_insumo ILIKE $1)
        ORDER BY i.nombre LIMIT 20`,
      [`%${q}%`],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Detalle ───────────────────────────────────────────────────────────────────
router.get("/:id", authorize("solicitudes"), async (req, res, next) => {
  try {
    const { rows: reqRows } = await pool.query(
      `SELECT r.*, d.nombre_dependencia, d.siglas,
              u.nombre_usuario, e.nombre, e.apellido, e.correo,
              pf.anio AS periodo_anio,
              er.nombre AS revisor_nombre, er.apellido AS revisor_apellido
         FROM requisicion r
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
         JOIN usuario u ON u.id_usuario = r.id_usuario
         JOIN empleado e ON e.id_empleado = u.id_empleado
         JOIN periodo_fiscal pf ON pf.id_periodo = r.id_periodo
         LEFT JOIN usuario ur ON ur.id_usuario = r.id_usuario_revisor
         LEFT JOIN empleado er ON er.id_empleado = ur.id_empleado
        WHERE r.id_requisicion = $1`,
      [req.params.id],
    );
    if (!reqRows[0]) return res.status(404).json({ error: "Requisición no encontrada" });

    if (!esGlobal(req.user)) {
      const dep = await dependenciaDeUsuario(req.user.id_usuario);
      if (reqRows[0].id_dependencia !== dep) {
        return res.status(403).json({ error: "No tiene permiso para ver esta requisición" });
      }
    }

    const { rows: items } = await pool.query(
      `SELECT dr.*, i.nombre AS insumo_nombre, i.codigo_insumo,
              um.nombre AS unidad_nombre, um.simbolo AS unidad_simbolo
         FROM detalle_requisicion dr
         LEFT JOIN insumo i ON i.id_insumo = dr.id_insumo
         JOIN unidad_medida um ON um.id_unidad_medida = dr.id_unidad_medida
        WHERE dr.id_requisicion = $1
        ORDER BY dr.id_detalle`,
      [req.params.id],
    );

    const { rows: bitacora } = await pool.query(
      `SELECT b.id_bitacora, b.id_usuario, b.accion, b.ip_acceso, b.fecha_acceso,
              b.modulo, b.detalle, u.nombre_usuario
         FROM bitacora_acceso b
         JOIN usuario u ON u.id_usuario = b.id_usuario
        WHERE b.modulo = 'Dependencias' AND b.detalle ILIKE '%' || $1 || '%'
        ORDER BY b.fecha_acceso DESC`,
      [reqRows[0].codigo_requisicion],
    );

    const { rows: imagenes } = await pool.query(
      `SELECT id_imagen, nombre_archivo, mime_type, contenido_base64, fecha_registro
         FROM requisicion_imagen
        WHERE id_requisicion = $1
        ORDER BY id_imagen`,
      [req.params.id],
    );

    res.json({ ...reqRows[0], items, bitacora, imagenes });
  } catch (e) {
    next(e);
  }
});

// ── Crear ─────────────────────────────────────────────────────────────────────
router.post("/", authorize("solicitudes"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      id_dependencia,
      tipo_solicitud = "Compra de Materiales",
      justificacion,
      lugar_entrega,
      prioridad = "Media",
      items,
    } = req.body;

    if (!justificacion || !justificacion.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "justificacion es requerido" });
    }
    if (!Array.isArray(items) || !items.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Debe incluir al menos un ítem" });
    }

    for (const item of items) {
      if (!item.id_unidad_medida) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Cada ítem requiere unidad de medida" });
      }
      const cantidad = parseFloat(item.cantidad);
      if (isNaN(cantidad) || cantidad <= 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Cantidad inválida en uno de los ítems" });
      }
    }

    let depId = id_dependencia;
    if (!esGlobal(req.user) || !depId) {
      depId = await dependenciaDeUsuario(req.user.id_usuario);
    }
    if (!depId) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No se pudo determinar la dependencia" });
    }

    const depCheck = await client.query(
      "SELECT activo FROM dependencia_municipal WHERE id_dependencia = $1",
      [depId],
    );
    if (!depCheck.rows[0] || !depCheck.rows[0].activo) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La dependencia no está activa" });
    }

    const periodo = await periodoActivo();
    if (!periodo) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No hay período fiscal activo" });
    }

    const monto = montoDeItems(items);

    // Validación de presupuesto disponible
    const presRes = await client.query(
      `SELECT pd.monto_asignado,
              COALESCE((SELECT SUM(COALESCE(r.monto_adjudicado, r.monto_estimado))
                          FROM requisicion r
                         WHERE r.id_dependencia = pd.id_dependencia
                           AND r.id_periodo = pd.id_periodo
                           AND r.estado IN ('Aprobada', 'En Compra')), 0) AS ejecutado
         FROM presupuesto_dependencia pd
        WHERE pd.id_dependencia = $1 AND pd.id_periodo = $2`,
      [depId, periodo.id_periodo],
    );
    if (presRes.rows[0]) {
      const disponible = parseFloat(presRes.rows[0].monto_asignado) - parseFloat(presRes.rows[0].ejecutado);
      if (monto > disponible) {
        await client.query("ROLLBACK");
        return res.status(422).json({
          error: "Presupuesto insuficiente",
          disponible: disponible.toFixed(2),
          solicitado: monto.toFixed(2),
        });
      }
    }

    const codigo = await nextCodigo(periodo.anio, client);

    const { rows: reqRows } = await client.query(
      `INSERT INTO requisicion
         (codigo_requisicion, id_usuario, id_dependencia, id_periodo, tipo_solicitud,
          justificacion, lugar_entrega, prioridad, monto_estimado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [codigo, req.user.id_usuario, depId, periodo.id_periodo, tipo_solicitud,
        justificacion, lugar_entrega ?? null, prioridad, monto],
    );
    const requisicion = reqRows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO detalle_requisicion
           (id_requisicion, id_insumo, descripcion_libre, id_unidad_medida, cantidad, precio_estimado, observaciones)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          requisicion.id_requisicion,
          item.id_insumo ?? null,
          item.descripcion_libre ?? null,
          item.id_unidad_medida,
          item.cantidad,
          item.precio_estimado ?? 0,
          item.observaciones ?? null,
        ],
      );
    }

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "requisicion_creada",
      ip: ipDe(req),
      modulo: "Dependencias",
      detalle: `Creada requisición ${codigo} por Q${monto.toFixed(2)}`,
    });

    res.status(201).json(requisicion);
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505") {
      return res.status(409).json({ error: "Código de requisición duplicado, reintente" });
    }
    next(e);
  } finally {
    client.release();
  }
});

// ── Documentos PDF de la requisición ──────────────────────────────────────────
router.post("/:id/imagenes", authorize("solicitudes"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: current } = await client.query(
      "SELECT * FROM requisicion WHERE id_requisicion = $1",
      [req.params.id],
    );
    if (!current[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Requisición no encontrada" });
    }
    if (!esGlobal(req.user)) {
      const dep = await dependenciaDeUsuario(req.user.id_usuario);
      if (current[0].id_dependencia !== dep) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "No tiene permiso para esta requisición" });
      }
    }

    const { imagenes } = req.body;
    if (!Array.isArray(imagenes) || !imagenes.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Debe incluir al menos un documento" });
    }

    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB por PDF
    for (const img of imagenes) {
      const mime = (img?.mime_type || "").toLowerCase();
      if (mime !== "application/pdf") {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Solo se permiten archivos PDF" });
      }
      const contenido = img?.contenido_base64;
      if (!contenido || typeof contenido !== "string") {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Cada documento requiere contenido_base64" });
      }
      if (Buffer.byteLength(contenido, "utf8") > MAX_BYTES) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Cada PDF no debe superar 10 MB" });
      }
      await client.query(
        `INSERT INTO requisicion_imagen (id_requisicion, nombre_archivo, mime_type, contenido_base64)
         VALUES ($1, $2, $3, $4)`,
        [
          req.params.id,
          img.nombre_archivo ?? "documento.pdf",
          "application/pdf",
          contenido,
        ],
      );
    }

    await client.query("COMMIT");

    const { rows: guardadas } = await client.query(
      `SELECT id_imagen, nombre_archivo, mime_type, fecha_registro
         FROM requisicion_imagen WHERE id_requisicion = $1 ORDER BY id_imagen`,
      [req.params.id],
    );
    res.status(201).json({ imagenes: guardadas });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Editar (solo Pendiente) ───────────────────────────────────────────────────
router.put("/:id", authorize("solicitudes"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: current } = await client.query(
      "SELECT * FROM requisicion WHERE id_requisicion = $1",
      [req.params.id],
    );
    if (!current[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Requisición no encontrada" });
    }
    if (current[0].estado !== "Pendiente") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Solo se puede editar en estado Pendiente" });
    }
    if (!esGlobal(req.user)) {
      const dep = await dependenciaDeUsuario(req.user.id_usuario);
      if (current[0].id_dependencia !== dep) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "No tiene permiso para editar esta requisición" });
      }
    }

    const { tipo_solicitud, justificacion, lugar_entrega, prioridad, items } = req.body;
    if (!justificacion || !justificacion.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "justificacion es requerido" });
    }
    if (!Array.isArray(items) || !items.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Debe incluir al menos un ítem" });
    }

    const monto = montoDeItems(items);

    const { rows } = await client.query(
      `UPDATE requisicion
          SET tipo_solicitud = $1, justificacion = $2, lugar_entrega = $3,
              prioridad = $4, monto_estimado = $5
        WHERE id_requisicion = $6
        RETURNING *`,
      [tipo_solicitud, justificacion, lugar_entrega ?? null, prioridad, monto, req.params.id],
    );

    await client.query("DELETE FROM detalle_requisicion WHERE id_requisicion = $1", [req.params.id]);
    for (const item of items) {
      await client.query(
        `INSERT INTO detalle_requisicion
           (id_requisicion, id_insumo, descripcion_libre, id_unidad_medida, cantidad, precio_estimado, observaciones)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.params.id,
          item.id_insumo ?? null,
          item.descripcion_libre ?? null,
          item.id_unidad_medida,
          item.cantidad,
          item.precio_estimado ?? 0,
          item.observaciones ?? null,
        ],
      );
    }

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "requisicion_editada",
      ip: ipDe(req),
      modulo: "Dependencias",
      detalle: `Editada requisición ${current[0].codigo_requisicion}`,
    });

    res.json(rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Cambio de estado (revisión / aprobación / rechazo / cancelación) ─────────
router.patch("/:id/estado", authorize("solicitudes"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: current } = await client.query(
      "SELECT * FROM requisicion WHERE id_requisicion = $1",
      [req.params.id],
    );
    if (!current[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Requisición no encontrada" });
    }

    const { estado, notas_aprobacion } = req.body;
    const validStates = ["Pendiente", "En Revisión", "Aprobada", "Rechazada", "En Compra", "Cancelada"];
    if (!validStates.includes(estado)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Estado inválido" });
    }
    if (estado === "Rechazada" && (!notas_aprobacion || !notas_aprobacion.trim())) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El motivo de rechazo es obligatorio" });
    }

    const actual = current[0].estado;
    if (actual === "Aprobada" && estado !== "En Compra") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Una requisición aprobada solo puede pasar a En Compra" });
    }
    if (["Rechazada", "Cancelada"].includes(actual)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No se puede cambiar el estado desde Rechazada o Cancelada" });
    }

    // Revalidar presupuesto al aprobar
    if (estado === "Aprobada") {
      const periodo = await periodoActivo();
      if (!periodo) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "No hay período fiscal activo" });
      }
      const presRes = await client.query(
        `SELECT pd.monto_asignado,
                COALESCE((SELECT SUM(COALESCE(r.monto_adjudicado, r.monto_estimado))
                            FROM requisicion r
                           WHERE r.id_dependencia = pd.id_dependencia
                             AND r.id_periodo = pd.id_periodo
                             AND r.estado IN ('Aprobada', 'En Compra')), 0) AS ejecutado
           FROM presupuesto_dependencia pd
          WHERE pd.id_dependencia = $1 AND pd.id_periodo = $2`,
        [current[0].id_dependencia, periodo.id_periodo],
      );
      if (presRes.rows[0]) {
        const disponible = parseFloat(presRes.rows[0].monto_asignado) - parseFloat(presRes.rows[0].ejecutado);
        const solicitado = parseFloat(current[0].monto_adjudicado ?? current[0].monto_estimado);
        if (solicitado > disponible) {
          await client.query("ROLLBACK");
          return res.status(422).json({
            error: "Presupuesto insuficiente al aprobar",
            disponible: disponible.toFixed(2),
            solicitado: solicitado.toFixed(2),
          });
        }
      }
    }

    const { rows } = await client.query(
      `UPDATE requisicion
          SET estado = $1, notas_aprobacion = $2, id_usuario_revisor = $3, fecha_resolucion = now()
        WHERE id_requisicion = $4
        RETURNING *`,
      [estado, notas_aprobacion ?? null, req.user.id_usuario, req.params.id],
    );

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: `requisicion_${estado.toLowerCase().replace(/\s+/g, "_")}`,
      ip: ipDe(req),
      modulo: "Dependencias",
      detalle: `Requisición ${current[0].codigo_requisicion}: ${actual} → ${estado}`,
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
