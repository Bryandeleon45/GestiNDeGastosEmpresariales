import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

router.use(authenticate);

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

// ── Catálogos: partidas y fuentes ─────────────────────────────────────────────
router.get("/partidas", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_partida, codigo, descripcion, activo FROM partida_presupuestaria WHERE activo = TRUE ORDER BY codigo",
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post("/partidas", authorize("configuracion"), async (req, res, next) => {
  try {
    const { codigo, descripcion } = req.body;
    if (!codigo || !descripcion) return res.status(400).json({ error: "codigo y descripcion son requeridos" });
    const { rows } = await pool.query(
      "INSERT INTO partida_presupuestaria (codigo, descripcion) VALUES ($1, $2) RETURNING *",
      [codigo.trim(), descripcion.trim()],
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Esa partida ya existe" });
    next(e);
  }
});

router.get("/fuentes-financiamiento", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_fuente, codigo, descripcion, activo FROM fuente_financiamiento WHERE activo = TRUE ORDER BY codigo",
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post("/fuentes-financiamiento", authorize("configuracion"), async (req, res, next) => {
  try {
    const { codigo, descripcion } = req.body;
    if (!codigo || !descripcion) return res.status(400).json({ error: "codigo y descripcion son requeridos" });
    const { rows } = await pool.query(
      "INSERT INTO fuente_financiamiento (codigo, descripcion) VALUES ($1, $2) RETURNING *",
      [codigo.trim(), descripcion.trim()],
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Esa fuente ya existe" });
    next(e);
  }
});

// ── Órdenes de compra disponibles para facturar ────────────────────────────────
router.get("/facturas/ordenes-compra", authorize("facturacion"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT oc.id_orden_compra, oc.numero_orden, oc.monto_total, oc.fecha_emision,
              oc.plazo_credito_dias, p.id_proveedor, p.nit, p.razon_social,
              (SELECT COALESCE(SUM(f.monto_total), 0) FROM factura f
                WHERE f.id_orden_compra = oc.id_orden_compra AND f.estado <> 'Rechazada') AS total_facturado
         FROM orden_compra oc
         JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
        WHERE oc.estado IN ('Aprobada', 'Enviada', 'Entregada')
        ORDER BY oc.fecha_emision DESC`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Resumen (KPIs) ─────────────────────────────────────────────────────────────
router.get("/facturacion/resumen", authorize("facturacion"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         COALESCE((SELECT SUM(op.monto)::numeric(12,2)
                     FROM orden_pago op
                    WHERE op.estado IN ('Pendiente','Programada')
                      AND EXTRACT(MONTH FROM op.fecha_vencimiento) = EXTRACT(MONTH FROM CURRENT_DATE)
                      AND EXTRACT(YEAR FROM op.fecha_vencimiento) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) AS total_por_pagar,
         (SELECT COUNT(*)::int FROM factura f
           WHERE f.estado IN ('Recibida','En Revisión','Aprobada')
             AND NOT EXISTS (SELECT 1 FROM orden_pago op2 WHERE op2.id_factura = f.id_factura AND op2.estado <> 'Anulada')) AS facturas_pendientes,
         (SELECT COUNT(*)::int FROM factura f
           WHERE f.estado = 'En Revisión') AS en_revision,
         (SELECT COUNT(*)::int FROM factura f
           WHERE f.estado IN ('Recibida','En Revisión','Aprobada')
             AND f.fecha_vencimiento <= CURRENT_DATE + 7
             AND NOT EXISTS (SELECT 1 FROM orden_pago op3 WHERE op3.id_factura = f.id_factura AND op3.estado IN ('Pagada'))) AS vencimientos_proximos`,
    );
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ── Cronograma de pagos ────────────────────────────────────────────────────────
router.get("/facturacion/cronograma", authorize("facturacion"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT op.numero_orden_pago, op.fecha_vencimiento, op.fecha_pago_programada,
              op.estado, op.monto, p.razon_social, f.numero_factura
         FROM orden_pago op
         JOIN factura f ON f.id_factura = op.id_factura
         JOIN proveedor p ON p.id_proveedor = op.id_proveedor
        WHERE op.estado IN ('Pendiente','Programada')
        ORDER BY COALESCE(op.fecha_pago_programada, op.fecha_vencimiento) ASC
        LIMIT 50`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Facturas: listado ──────────────────────────────────────────────────────────
router.get("/facturas", authorize("facturacion"), async (req, res, next) => {
  try {
    const { estado, q } = req.query;
    const where = ["1=1"];
    const params = [];
    const add = (v) => params.push(v);

    if (q) {
      where.push(`(f.numero_factura ILIKE $${params.length + 1} OR p.razon_social ILIKE $${params.length + 1})`);
      add(`%${q}%`);
    }

    const { rows } = await pool.query(
      `SELECT f.id_factura, f.serie, f.numero_factura, f.numero_autorizacion,
              f.fecha_emision, f.monto_total, f.fecha_vencimiento, f.estado,
              f.motivo_rechazo, f.observaciones, f.origen,
              p.nit, p.razon_social,
              oc.numero_orden,
              v.estado_visible,
              op.numero_orden_pago, op.estado AS estado_pago
         FROM factura f
         JOIN proveedor p ON p.id_proveedor = f.id_proveedor
         JOIN orden_compra oc ON oc.id_orden_compra = f.id_orden_compra
         JOIN v_factura_estado v ON v.id_factura = f.id_factura
         LEFT JOIN orden_pago op ON op.id_factura = f.id_factura AND op.estado <> 'Anulada'
        WHERE ${where.join(" AND ")}
        ORDER BY f.fecha_emision DESC, f.id_factura DESC`,
      params,
    );

    if (estado && estado !== "Todos") {
      return res.json(rows.filter((r) => (r.estado_visible ?? "").toLowerCase() === estado.toLowerCase()));
    }
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Factura: detalle ───────────────────────────────────────────────────────────
router.get("/facturas/:id", authorize("facturacion"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT f.*, p.nit, p.razon_social, oc.numero_orden, oc.monto_total AS oc_monto,
              oc.plazo_credito_dias AS oc_plazo,
              v.estado_visible
         FROM factura f
         JOIN proveedor p ON p.id_proveedor = f.id_proveedor
         JOIN orden_compra oc ON oc.id_orden_compra = f.id_orden_compra
         JOIN v_factura_estado v ON v.id_factura = f.id_factura
        WHERE f.id_factura = $1`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Factura no encontrada" });

    const { rows: op } = await pool.query(
      "SELECT * FROM orden_pago WHERE id_factura = $1 AND estado <> 'Anulada'",
      [req.params.id],
    );
    res.json({ ...rows[0], orden_pago: op[0] ?? null });
  } catch (e) {
    next(e);
  }
});

// ── Factura: registro manual ───────────────────────────────────────────────────
router.post("/facturas", authorize("facturacion"), async (req, res, next) => {
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

    const ocRes = await client.query(
      "SELECT * FROM orden_compra WHERE id_orden_compra = $1 FOR UPDATE",
      [id_orden_compra],
    );
    const oc = ocRes.rows[0];
    if (!oc) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Orden de compra no encontrada" });
    }
    if (!["Aprobada", "Enviada", "Entregada"].includes(oc.estado)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La orden de compra debe estar Aprobada o posterior" });
    }

    // Duplicado: misma serie y número del proveedor
    const dup = await client.query(
      `SELECT 1 FROM factura WHERE id_proveedor = $1 AND serie IS NOT DISTINCT FROM $2 AND numero_factura = $3`,
      [oc.id_proveedor, serie || null, numero_factura.trim()],
    );
    if (dup.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Ya existe una factura con esa serie y número" });
    }

    // Monto: no superar lo ya facturado + esta factura vs el monto de la OC
    const facturadoRes = await client.query(
      "SELECT COALESCE(SUM(monto_total), 0) AS total FROM factura WHERE id_orden_compra = $1 AND estado <> 'Rechazada'",
      [id_orden_compra],
    );
    const facturado = parseFloat(facturadoRes.rows[0].total);
    const nuevo = parseFloat(monto_total);
    if (facturado + nuevo > parseFloat(oc.monto_total) + 0.001) {
      await client.query("ROLLBACK");
      return res.status(422).json({
        error: "El monto facturado supera el monto de la orden de compra",
        disponible: (parseFloat(oc.monto_total) - facturado).toFixed(2),
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
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'MANUAL',$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        id_orden_compra,
        oc.id_proveedor,
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

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "factura_registrada",
      ip: ipDe(req),
      modulo: "Facturación",
      detalle: `Registro de factura ${numero_factura} para ${oc.numero_orden}`,
    });

    res.status(201).json(factRows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Factura: revisión (iniciar / aprobar / rechazar) ───────────────────────────
router.patch("/facturas/:id/revision", authorize("facturacion"), async (req, res, next) => {
  try {
    const { accion, motivo_rechazo } = req.body;
    if (!["iniciar", "aprobar", "rechazar"].includes(accion)) {
      return res.status(400).json({ error: "Acción inválida" });
    }

    const { rows: cur } = await pool.query("SELECT * FROM factura WHERE id_factura = $1", [req.params.id]);
    if (!cur[0]) return res.status(404).json({ error: "Factura no encontrada" });
    const factura = cur[0];

    let estado;
    if (accion === "iniciar") estado = "En Revisión";
    else if (accion === "aprobar") estado = "Aprobada";
    else {
      estado = "Rechazada";
      if (!motivo_rechazo || !motivo_rechazo.trim()) {
        return res.status(400).json({ error: "El motivo de rechazo es obligatorio" });
      }
    }

    const { rows } = await pool.query(
      `UPDATE factura
          SET estado = $1, motivo_rechazo = $2, id_usuario_revisa = $3, fecha_revision = now()
        WHERE id_factura = $4
        RETURNING *`,
      [estado, accion === "rechazar" ? motivo_rechazo.trim() : null, req.user.id_usuario, req.params.id],
    );

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: `factura_${accion}`,
      ip: ipDe(req),
      modulo: "Facturación",
      detalle: `Factura ${factura.numero_factura}: ${factura.estado} → ${estado}`,
    });

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ── Órdenes de pago ────────────────────────────────────────────────────────────
router.get("/ordenes-pago", authorize("facturacion"), async (req, res, next) => {
  try {
    const { estado } = req.query;
    const where = ["1=1"];
    const params = [];
    if (estado) {
      where.push(`op.estado = $${params.length + 1}`);
      params.push(estado);
    }
    const { rows } = await pool.query(
      `SELECT op.*, p.nit, p.razon_social, f.numero_factura,
              pa.codigo AS partida_codigo, pa.descripcion AS partida_desc,
              fu.codigo AS fuente_codigo, fu.descripcion AS fuente_desc
         FROM orden_pago op
         JOIN factura f ON f.id_factura = op.id_factura
         JOIN proveedor p ON p.id_proveedor = op.id_proveedor
         LEFT JOIN partida_presupuestaria pa ON pa.id_partida = op.id_partida
         LEFT JOIN fuente_financiamiento fu ON fu.id_fuente = op.id_fuente
        WHERE ${where.join(" AND ")}
        ORDER BY op.fecha_registro DESC`,
      params,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post("/ordenes-pago", authorize("facturacion"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id_factura, concepto, monto, id_partida, id_fuente, fecha_vencimiento } = req.body;
    if (!id_factura) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La factura es requerida" });
    }
    if (!concepto || !concepto.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El concepto es requerido" });
    }
    if (!(parseFloat(monto) > 0)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El monto debe ser mayor que 0" });
    }

    const facRes = await client.query("SELECT * FROM factura WHERE id_factura = $1", [id_factura]);
    const factura = facRes.rows[0];
    if (!factura) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Factura no encontrada" });
    }
    if (factura.estado !== "Aprobada") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Solo se crean órdenes de pago de facturas Aprobadas" });
    }
    if (parseFloat(monto) > parseFloat(factura.monto_total) + 0.001) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El monto no puede superar el de la factura" });
    }

    const numero = await nextNumero("OP", "orden_pago", "numero_orden_pago", client);
    const { rows } = await client.query(
      `INSERT INTO orden_pago
         (numero_orden_pago, id_factura, id_proveedor, concepto, monto,
          id_partida, id_fuente, fecha_vencimiento, id_usuario_crea)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        numero,
        factura.id_factura,
        factura.id_proveedor,
        concepto.trim(),
        parseFloat(monto).toFixed(2),
        id_partida || null,
        id_fuente || null,
        fecha_vencimiento || factura.fecha_vencimiento,
        req.user.id_usuario,
      ],
    );

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "orden_pago_creada",
      ip: ipDe(req),
      modulo: "Facturación",
      detalle: `Orden de pago ${numero} por Q${monto}`,
    });

    res.status(201).json(rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505") return res.status(409).json({ error: "Ya existe una orden de pago vigente para esta factura" });
    next(e);
  } finally {
    client.release();
  }
});

router.patch("/ordenes-pago/:id/programar", authorize("facturacion"), async (req, res, next) => {
  try {
    const { fecha_pago_programada, id_partida, id_fuente } = req.body;
    const { rows: cur } = await pool.query("SELECT * FROM orden_pago WHERE id_orden_pago = $1", [req.params.id]);
    if (!cur[0]) return res.status(404).json({ error: "Orden de pago no encontrada" });
    if (cur[0].estado !== "Pendiente") return res.status(400).json({ error: "Solo se programa una orden Pendiente" });

    const { rows } = await pool.query(
      `UPDATE orden_pago
          SET estado = 'Programada', fecha_pago_programada = $1,
              id_partida = COALESCE($2, id_partida), id_fuente = COALESCE($3, id_fuente),
              id_usuario_programa = $4
        WHERE id_orden_pago = $5
        RETURNING *`,
      [fecha_pago_programada || null, id_partida || null, id_fuente || null, req.user.id_usuario, req.params.id],
    );

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "orden_pago_programada",
      ip: ipDe(req),
      modulo: "Facturación",
      detalle: `Programación de pago ${cur[0].numero_orden_pago}`,
    });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.patch("/ordenes-pago/:id/pago", authorize("facturacion"), async (req, res, next) => {
  try {
    const { fecha_pago_real, referencia_pago } = req.body;
    const { rows: cur } = await pool.query("SELECT * FROM orden_pago WHERE id_orden_pago = $1", [req.params.id]);
    if (!cur[0]) return res.status(404).json({ error: "Orden de pago no encontrada" });
    if (!["Pendiente", "Programada"].includes(cur[0].estado)) {
      return res.status(400).json({ error: "Solo se paga una orden Pendiente o Programada" });
    }
    if (!fecha_pago_real || !referencia_pago || !referencia_pago.trim()) {
      return res.status(400).json({ error: "La fecha y la referencia del pago son obligatorias" });
    }

    const { rows } = await pool.query(
      `UPDATE orden_pago
          SET estado = 'Pagada', fecha_pago_real = $1, referencia_pago = $2, id_usuario_paga = $3
        WHERE id_orden_pago = $4
        RETURNING *`,
      [fecha_pago_real, referencia_pago.trim(), req.user.id_usuario, req.params.id],
    );

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "orden_pago_pagada",
      ip: ipDe(req),
      modulo: "Facturación",
      detalle: `Pago registrado ${cur[0].numero_orden_pago} (ref ${referencia_pago})`,
    });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.patch("/ordenes-pago/:id/anular", authorize("facturacion"), async (req, res, next) => {
  try {
    const { motivo_anulacion } = req.body;
    if (!motivo_anulacion || !motivo_anulacion.trim()) {
      return res.status(400).json({ error: "El motivo de anulación es obligatorio" });
    }
    const { rows: cur } = await pool.query("SELECT * FROM orden_pago WHERE id_orden_pago = $1", [req.params.id]);
    if (!cur[0]) return res.status(404).json({ error: "Orden de pago no encontrada" });
    if (cur[0].estado === "Pagada") return res.status(400).json({ error: "Una orden Pagada no se puede anular" });

    const { rows } = await pool.query(
      "UPDATE orden_pago SET estado = 'Anulada', motivo_anulacion = $1 WHERE id_orden_pago = $2 RETURNING *",
      [motivo_anulacion.trim(), req.params.id],
    );

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "orden_pago_anulada",
      ip: ipDe(req),
      modulo: "Facturación",
      detalle: `Anulación de pago ${cur[0].numero_orden_pago}`,
    });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

export default router;
