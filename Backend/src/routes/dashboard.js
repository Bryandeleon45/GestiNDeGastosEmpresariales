import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

router.use(authenticate);

// ── Resumen (KPIs) ────────────────────────────────────────────────────────────
router.get("/resumen", async (req, res, next) => {
  try {
    const fi = req.query.fechaInicio || null;
    const ff = req.query.fechaFin || null;
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM requisicion
           WHERE ($1::date IS NULL OR fecha_solicitud >= $1)
             AND ($2::date IS NULL OR fecha_solicitud < $2::date + 1)) AS total_solicitudes,
         (SELECT COUNT(*)::int FROM requisicion WHERE estado = 'Pendiente') AS solicitudes_pendientes,
         (SELECT COUNT(*)::int FROM requisicion WHERE estado = 'Pendiente' AND prioridad IN ('Alta','Urgente')) AS solicitudes_urgentes,
         (SELECT COUNT(*)::int FROM orden_compra WHERE estado IN ('Pendiente','Aprobada','Enviada')) AS ordenes_pendientes,
         (SELECT COUNT(*)::int FROM recepcion_bodega WHERE estado IN ('Parcial','Con Novedades')) AS entregas_parciales,
         (SELECT COUNT(*)::int FROM insumo_bodega WHERE stock_minimo > 0 AND stock_actual <= stock_minimo) AS insumos_bajo_minimo,
         (SELECT COUNT(*)::int FROM factura f
           WHERE f.estado IN ('Recibida','En Revisión','Aprobada')
             AND NOT EXISTS (SELECT 1 FROM orden_pago op WHERE op.id_factura = f.id_factura AND op.estado <> 'Anulada')) AS facturas_por_pagar,
         (SELECT COUNT(*)::int FROM vale_salida WHERE estado = 'Pendiente') AS vales_pendientes,
         (SELECT COUNT(*)::int FROM proveedor WHERE activo = TRUE) AS proveedores_activos,
         (SELECT COALESCE(SUM(monto_total), 0)::numeric(12,2) FROM orden_compra WHERE estado <> 'Cancelada') AS compras_comprometidas`,
      [fi, ff],
    );
    res.json({
      generadoEn: new Date().toISOString(),
      kpis: rows[0],
    });
  } catch (e) {
    next(e);
  }
});

// ── Gráficos ──────────────────────────────────────────────────────────────────
router.get("/graficos/compras-por-dependencia", async (req, res, next) => {
  try {
    const fi = req.query.fechaInicio || null;
    const ff = req.query.fechaFin || null;
    const { rows } = await pool.query(
      `SELECT d.nombre_dependencia AS name, COALESCE(SUM(oc.monto_total), 0)::numeric(12,2) AS value
         FROM dependencia_municipal d
         LEFT JOIN requisicion r ON r.id_dependencia = d.id_dependencia
         LEFT JOIN orden_compra oc ON oc.id_requisicion = r.id_requisicion
           AND oc.estado IN ('Aprobada','Enviada','Entregada')
           AND ($1::date IS NULL OR oc.fecha_emision >= $1)
           AND ($2::date IS NULL OR oc.fecha_emision < $2::date + 1)
        GROUP BY d.nombre_dependencia
        ORDER BY value DESC`,
      [fi, ff],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get("/graficos/solicitudes-por-estado", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT estado AS name, COUNT(*)::int AS value FROM requisicion GROUP BY estado ORDER BY value DESC`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Alertas ───────────────────────────────────────────────────────────────────
router.get("/alertas", async (_req, res, next) => {
  try {
    const { rows: stock } = await pool.query(
      `SELECT i.codigo_insumo, i.nombre, um.simbolo AS unidad,
              ib.stock_actual, ib.stock_minimo, (ib.stock_minimo - ib.stock_actual) AS faltante
         FROM insumo i
         JOIN unidad_medida um ON um.id_unidad_medida = i.id_unidad_medida
         JOIN insumo_bodega ib ON ib.id_insumo = i.id_insumo
        WHERE i.activo = TRUE AND ib.stock_minimo > 0 AND ib.stock_actual <= ib.stock_minimo
        ORDER BY (ib.stock_actual::numeric / NULLIF(ib.stock_minimo, 0)) ASC
        LIMIT 15`,
    );
    const { rows: atrasadas } = await pool.query(
      `SELECT oc.numero_orden, p.razon_social, oc.fecha_entrega_estimada,
              (CURRENT_DATE - oc.fecha_entrega_estimada::date) AS dias_atraso
         FROM orden_compra oc
         JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
        WHERE oc.estado IN ('Aprobada','Enviada') AND oc.fecha_entrega_estimada IS NOT NULL
          AND oc.fecha_entrega_estimada < CURRENT_DATE
        ORDER BY dias_atraso DESC
        LIMIT 10`,
    );
    res.json({ stock: stock.map((s) => ({ ...s, tipo: "STOCK_BAJO" })), ordenes_atrasadas: atrasadas.map((a) => ({ ...a, tipo: "ORDEN_ATRASADA" })) });
  } catch (e) {
    next(e);
  }
});

// ── Actividad reciente ────────────────────────────────────────────────────────
router.get("/actividad-reciente", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.codigo_requisicion, r.fecha_solicitud, d.nombre_dependencia, r.estado, r.prioridad,
              COALESCE(r.monto_adjudicado, r.monto_estimado) AS monto
         FROM requisicion r
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
        ORDER BY r.fecha_solicitud DESC
        LIMIT 10`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
