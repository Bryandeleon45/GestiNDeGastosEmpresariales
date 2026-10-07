import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

router.use(authenticate);

// ── Catálogo declarativo de reportes ──────────────────────────────────────────
const CATALOGO = [
  { codigo: "RPT-01", titulo: "Kardex por Insumo", descripcion: "Entradas, salidas y saldo de un insumo.", categoria: "Inventario y Kardex", requiereInsumo: true },
  { codigo: "RPT-02", titulo: "Existencias y Stock Mínimo", descripcion: "Existencias actuales con alertas de stock bajo.", categoria: "Inventario y Kardex" },
  { codigo: "RPT-04", titulo: "Consumo por Dependencia", descripcion: "Despachos entregados agrupados por dependencia.", categoria: "Inventario y Kardex" },
  { codigo: "RPT-05", titulo: "Solicitudes de Compra", descripcion: "Solicitudes por estado, prioridad y dependencia.", categoria: "Compras" },
  { codigo: "RPT-06", titulo: "Historial de Compras por Proveedor", descripcion: "Órdenes y montos acumulados por proveedor.", categoria: "Compras" },
  { codigo: "RPT-08", titulo: "Órdenes de Compra y Cumplimiento", descripcion: "Estado de las órdenes y sus recepciones.", categoria: "Compras" },
  { codigo: "RPT-09", titulo: "Recepciones en Bodega", descripcion: "Recibido vs. aceptado por recepción.", categoria: "Compras" },
  { codigo: "RPT-11", titulo: "Resumen Ejecutivo del Almacén", descripcion: "Estado general: compras, consumo y existencias.", categoria: "Ejecutivos" },
];

function columnasPara(codigo) {
  const map = {
    "RPT-01": [
      { campo: "fecha_movimiento", titulo: "Fecha" },
      { campo: "insumo", titulo: "Insumo" },
      { campo: "tipo_movimiento", titulo: "Tipo" },
      { campo: "cantidad", titulo: "Cantidad" },
      { campo: "stock_anterior", titulo: "Anterior" },
      { campo: "stock_actual", titulo: "Saldo" },
      { campo: "nombre_usuario", titulo: "Usuario" },
    ],
    "RPT-02": [
      { campo: "codigo_insumo", titulo: "Código" },
      { campo: "insumo", titulo: "Insumo" },
      { campo: "categoria", titulo: "Categoría" },
      { campo: "unidad", titulo: "Unidad" },
      { campo: "stock_actual", titulo: "Stock" },
      { campo: "stock_minimo", titulo: "Mínimo" },
      { campo: "alerta", titulo: "Estado" },
    ],
    "RPT-04": [
      { campo: "nombre_dependencia", titulo: "Dependencia" },
      { campo: "categoria", titulo: "Categoría" },
      { campo: "insumo", titulo: "Insumo" },
      { campo: "unidad", titulo: "Unidad" },
      { campo: "cantidad_total", titulo: "Cantidad" },
      { campo: "vales", titulo: "Vales" },
    ],
    "RPT-05": [
      { campo: "codigo_requisicion", titulo: "Código" },
      { campo: "fecha_solicitud", titulo: "Fecha" },
      { campo: "nombre_dependencia", titulo: "Dependencia" },
      { campo: "tipo_solicitud", titulo: "Tipo" },
      { campo: "prioridad", titulo: "Prioridad" },
      { campo: "estado", titulo: "Estado" },
      { campo: "monto", titulo: "Monto" },
    ],
    "RPT-06": [
      { campo: "razon_social", titulo: "Proveedor" },
      { campo: "nit", titulo: "NIT" },
      { campo: "ordenes", titulo: "Órdenes" },
      { campo: "monto_total", titulo: "Monto Total" },
      { campo: "primera", titulo: "Primera Compra" },
      { campo: "ultima", titulo: "Última Compra" },
    ],
    "RPT-08": [
      { campo: "numero_orden", titulo: "Orden" },
      { campo: "fecha_emision", titulo: "Fecha" },
      { campo: "razon_social", titulo: "Proveedor" },
      { campo: "monto_total", titulo: "Monto" },
      { campo: "estado", titulo: "Estado" },
      { campo: "recepciones", titulo: "Recepciones" },
    ],
    "RPT-09": [
      { campo: "numero_comprobante", titulo: "Comprobante" },
      { campo: "fecha_recepcion", titulo: "Fecha" },
      { campo: "numero_orden", titulo: "Orden" },
      { campo: "razon_social", titulo: "Proveedor" },
      { campo: "estado", titulo: "Estado" },
      { campo: "esperado", titulo: "Esperado" },
      { campo: "aceptado", titulo: "Aceptado" },
    ],
    "RPT-11": [
      { campo: "name", titulo: "Proveedor" },
      { campo: "value", titulo: "Monto Comprometido" },
    ],
  };
  return map[codigo] ?? [];
}

// ── Opciones de filtros ───────────────────────────────────────────────────────
router.get("/filtros/opciones", authorize("reportes"), async (_req, res, next) => {
  try {
    const [deps, provs, cats, ins] = await Promise.all([
      pool.query("SELECT id_dependencia, nombre_dependencia FROM dependencia_municipal WHERE activo = TRUE ORDER BY nombre_dependencia"),
      pool.query("SELECT id_proveedor, razon_social, nit FROM proveedor WHERE activo = TRUE ORDER BY razon_social"),
      pool.query("SELECT id_categoria, nombre FROM categoria WHERE activo = TRUE ORDER BY nombre"),
      pool.query("SELECT id_insumo, codigo_insumo, nombre FROM insumo WHERE activo = TRUE ORDER BY nombre"),
    ]);
    res.json({
      dependencias: deps.rows,
      proveedores: provs.rows,
      categorias: cats.rows,
      insumos: ins.rows,
    });
  } catch (e) {
    next(e);
  }
});

// ── Catálogo ──────────────────────────────────────────────────────────────────
router.get("/", authorize("reportes"), (_req, res) => {
  res.json(CATALOGO);
});

// ── Datos del reporte ─────────────────────────────────────────────────────────
router.get("/:codigo", authorize("reportes"), async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const q = req.query;
    const fi = q.fechaInicio || null;
    const ff = q.fechaFin || null;
    const idDep = q.idDependencia || null;
    const idProv = q.idProveedor || null;
    const idCat = q.idCategoria || null;
    const idIns = q.idInsumo || null;
    const estado = q.estado || null;
    const prioridad = q.prioridad || null;

    let filas = [];
    let totales = null;
    let grafico = null;
    let extra = null;

    switch (codigo) {
      case "RPT-01": {
        const { rows } = await pool.query(
          `SELECT to_char(k.fecha_movimiento, 'DD/MM/YYYY HH24:MI') AS fecha_movimiento,
                  i.codigo_insumo || ' ' || i.nombre AS insumo,
                  k.tipo_movimiento, k.cantidad, k.stock_anterior, k.stock_actual, u.nombre_usuario
             FROM kardex k
             JOIN insumo i ON i.id_insumo = k.id_insumo
             JOIN usuario u ON u.id_usuario = k.id_usuario
            WHERE ($1::int IS NULL OR k.id_insumo = $1)
              AND ($2::date IS NULL OR k.fecha_movimiento >= $2)
              AND ($3::date IS NULL OR k.fecha_movimiento < $3::date + 1)
            ORDER BY k.fecha_movimiento DESC LIMIT 500`,
          [idIns, fi, ff],
        );
        filas = rows;
        break;
      }
      case "RPT-02": {
        const { rows } = await pool.query(
          `SELECT i.codigo_insumo, i.nombre AS insumo, c.nombre AS categoria, um.simbolo AS unidad,
                  COALESCE(ib.stock_actual, 0) AS stock_actual, COALESCE(ib.stock_minimo, 0) AS stock_minimo
             FROM insumo i
             JOIN categoria c ON c.id_categoria = i.id_categoria
             JOIN unidad_medida um ON um.id_unidad_medida = i.id_unidad_medida
             LEFT JOIN insumo_bodega ib ON ib.id_insumo = i.id_insumo
            WHERE i.activo = TRUE AND ($1::int IS NULL OR i.id_categoria = $1)
            ORDER BY i.nombre`,
          [idCat],
        );
        filas = rows.map((r) => {
          const alerta = r.stock_minimo > 0 && r.stock_actual < r.stock_minimo * 0.5
            ? "Crítico"
            : r.stock_actual <= r.stock_minimo
              ? "Bajo"
              : "OK";
          return { ...r, alerta };
        });
        break;
      }
      case "RPT-04": {
        const { rows } = await pool.query(
          `SELECT d.nombre_dependencia, c.nombre AS categoria, i.nombre AS insumo, um.simbolo AS unidad,
                  SUM(dv.cantidad_salida)::int AS cantidad_total, COUNT(DISTINCT v.id_vale_salida)::int AS vales
             FROM vale_salida v
             JOIN detalle_vale_salida dv ON dv.id_vale_salida = v.id_vale_salida
             JOIN dependencia_municipal d ON d.id_dependencia = v.id_dependencia
             JOIN insumo i ON i.id_insumo = dv.id_insumo
             JOIN categoria c ON c.id_categoria = i.id_categoria
             JOIN unidad_medida um ON um.id_unidad_medida = i.id_unidad_medida
            WHERE v.estado = 'Entregado'
              AND ($1::date IS NULL OR v.fecha_salida >= $1)
              AND ($2::date IS NULL OR v.fecha_salida < $2::date + 1)
              AND ($3::int IS NULL OR v.id_dependencia = $3)
            GROUP BY d.nombre_dependencia, c.nombre, i.nombre, um.simbolo
            ORDER BY d.nombre_dependencia, cantidad_total DESC`,
          [fi, ff, idDep],
        );
        filas = rows;
        break;
      }
      case "RPT-05": {
        const { rows } = await pool.query(
          `SELECT r.codigo_requisicion, to_char(r.fecha_solicitud, 'DD/MM/YYYY') AS fecha_solicitud,
                  d.nombre_dependencia, r.tipo_solicitud, r.prioridad, r.estado,
                  COALESCE(r.monto_adjudicado, r.monto_estimado) AS monto
             FROM requisicion r
             JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
            WHERE ($1::int IS NULL OR r.id_dependencia = $1)
              AND ($2::text IS NULL OR r.estado = $2)
              AND ($3::text IS NULL OR r.prioridad = $3)
              AND ($4::date IS NULL OR r.fecha_solicitud >= $4)
              AND ($5::date IS NULL OR r.fecha_solicitud < $5::date + 1)
            ORDER BY r.fecha_solicitud DESC LIMIT 500`,
          [idDep, estado, prioridad, fi, ff],
        );
        filas = rows;
        break;
      }
      case "RPT-06": {
        const { rows } = await pool.query(
          `SELECT p.razon_social, p.nit, COUNT(*)::int AS ordenes, SUM(oc.monto_total)::numeric(12,2) AS monto_total,
                  to_char(MIN(oc.fecha_emision), 'DD/MM/YYYY') AS primera, to_char(MAX(oc.fecha_emision), 'DD/MM/YYYY') AS ultima
             FROM orden_compra oc
             JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
            WHERE oc.estado <> 'Cancelada'
              AND ($1::date IS NULL OR oc.fecha_emision >= $1)
              AND ($2::date IS NULL OR oc.fecha_emision < $2::date + 1)
              AND ($3::int IS NULL OR oc.id_proveedor = $3)
            GROUP BY p.razon_social, p.nit
            ORDER BY monto_total DESC`,
          [fi, ff, idProv],
        );
        filas = rows;
        totales = { montoTotal: rows.reduce((s, r) => s + Number(r.monto_total), 0) };
        break;
      }
      case "RPT-08": {
        const { rows } = await pool.query(
          `SELECT oc.numero_orden, to_char(oc.fecha_emision, 'DD/MM/YYYY') AS fecha_emision,
                  p.razon_social, oc.monto_total, oc.estado,
                  (SELECT COUNT(*)::int FROM recepcion_bodega rb WHERE rb.id_orden_compra = oc.id_orden_compra) AS recepciones
             FROM orden_compra oc
             JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
            WHERE ($1::text IS NULL OR oc.estado = $1)
              AND ($2::date IS NULL OR oc.fecha_emision >= $2)
              AND ($3::date IS NULL OR oc.fecha_emision < $3::date + 1)
              AND ($4::int IS NULL OR oc.id_proveedor = $4)
            ORDER BY oc.fecha_emision DESC LIMIT 500`,
          [estado, fi, ff, idProv],
        );
        filas = rows;
        break;
      }
      case "RPT-09": {
        const { rows } = await pool.query(
          `SELECT rb.numero_comprobante, to_char(rb.fecha_recepcion, 'DD/MM/YYYY HH24:MI') AS fecha_recepcion,
                  oc.numero_orden, p.razon_social, rb.estado,
                  COALESCE((SELECT SUM(drb.cantidad_esperada) FROM detalle_recepcion_bodega drb WHERE drb.id_recepcion = rb.id_recepcion), 0) AS esperado,
                  COALESCE((SELECT SUM(drb.cantidad_aceptada) FROM detalle_recepcion_bodega drb WHERE drb.id_recepcion = rb.id_recepcion), 0) AS aceptado
             FROM recepcion_bodega rb
             JOIN orden_compra oc ON oc.id_orden_compra = rb.id_orden_compra
             JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
            WHERE ($1::date IS NULL OR rb.fecha_recepcion >= $1)
              AND ($2::date IS NULL OR rb.fecha_recepcion < $2::date + 1)
              AND ($3::int IS NULL OR oc.id_proveedor = $3)
            ORDER BY rb.fecha_recepcion DESC LIMIT 500`,
          [fi, ff, idProv],
        );
        filas = rows;
        break;
      }
      case "RPT-11": {
        const { rows: kpi } = await pool.query(
          `SELECT
             (SELECT COUNT(*)::int FROM requisicion) AS solicitudes,
             (SELECT COUNT(*)::int FROM orden_compra WHERE estado <> 'Cancelada') AS ordenes,
             (SELECT COALESCE(SUM(monto_total), 0)::numeric(12,2) FROM orden_compra WHERE estado <> 'Cancelada') AS comprometido,
             (SELECT COALESCE(SUM(monto_adjudicado), 0)::numeric(12,2) FROM requisicion) AS adjudicado,
             (SELECT COUNT(*)::int FROM insumo) AS insumos,
             (SELECT COALESCE(SUM(stock_actual), 0)::int FROM insumo_bodega) AS stock_total`,
        );
        const { rows: graf } = await pool.query(
          `SELECT p.razon_social AS name, COALESCE(SUM(oc.monto_total), 0)::numeric(12,2) AS value
             FROM proveedor p
             LEFT JOIN orden_compra oc ON oc.id_proveedor = p.id_proveedor AND oc.estado <> 'Cancelada'
            GROUP BY p.razon_social
            ORDER BY value DESC LIMIT 10`,
        );
        const { rows: solEstado } = await pool.query(
          `SELECT estado AS name, COUNT(*)::int AS value FROM requisicion GROUP BY estado ORDER BY value DESC`,
        );
        const { rows: ocEstado } = await pool.query(
          `SELECT estado AS name, COUNT(*)::int AS value FROM orden_compra GROUP BY estado ORDER BY value DESC`,
        );
        totales = kpi[0];
        grafico = graf;
        filas = graf;
        extra = { solicitudes_por_estado: solEstado, ordenes_por_estado: ocEstado };
        break;
      }
      default:
        return res.status(404).json({ error: "Reporte no encontrado" });
    }

    const meta = CATALOGO.find((c) => c.codigo === codigo);

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "consulta_reporte",
      ip: ipDe(req),
      modulo: "Reportes",
      detalle: `Consulta ${codigo}`,
    });

    res.json({ codigo, titulo: meta.titulo, columnas: columnasPara(codigo), filas, totales, grafico, extra });
  } catch (e) {
    next(e);
  }
});

// ── Exportar CSV ──────────────────────────────────────────────────────────────
router.get("/:codigo/exportar", authorize("reportes"), async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const filas = await obtenerFilas(codigo, req.query);
    const columnas = columnasPara(codigo);
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      columnas.map((c) => esc(c.titulo)).join(","),
      ...filas.map((f) => columnas.map((c) => esc(f[c.campo])).join(",")),
    ].join("\n");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "exporta_reporte",
      ip: ipDe(req),
      modulo: "Reportes",
      detalle: `Exporta ${codigo} CSV`,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=reporte_${codigo}.csv`);
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

// Helper duplicado para exportar (extrae filas por código)
async function obtenerFilas(codigo, q) {
  const fi = q.fechaInicio || null;
  const ff = q.fechaFin || null;
  const idDep = q.idDependencia || null;
  const idProv = q.idProveedor || null;
  const idCat = q.idCategoria || null;
  const idIns = q.idInsumo || null;
  const estado = q.estado || null;
  const prioridad = q.prioridad || null;

  switch (codigo) {
    case "RPT-01": {
      const { rows } = await pool.query(
        `SELECT to_char(k.fecha_movimiento, 'DD/MM/YYYY HH24:MI') AS fecha_movimiento,
                i.codigo_insumo || ' ' || i.nombre AS insumo, k.tipo_movimiento, k.cantidad,
                k.stock_anterior, k.stock_actual, u.nombre_usuario
           FROM kardex k JOIN insumo i ON i.id_insumo = k.id_insumo JOIN usuario u ON u.id_usuario = k.id_usuario
          WHERE ($1::int IS NULL OR k.id_insumo = $1) AND ($2::date IS NULL OR k.fecha_movimiento >= $2) AND ($3::date IS NULL OR k.fecha_movimiento < $3::date + 1)
          ORDER BY k.fecha_movimiento DESC LIMIT 500`,
        [idIns, fi, ff],
      );
      return rows;
    }
    case "RPT-02": {
      const { rows } = await pool.query(
        `SELECT i.codigo_insumo, i.nombre AS insumo, c.nombre AS categoria, um.simbolo AS unidad,
                COALESCE(ib.stock_actual, 0) AS stock_actual, COALESCE(ib.stock_minimo, 0) AS stock_minimo
           FROM insumo i JOIN categoria c ON c.id_categoria = i.id_categoria JOIN unidad_medida um ON um.id_unidad_medida = i.id_unidad_medida
           LEFT JOIN insumo_bodega ib ON ib.id_insumo = i.id_insumo
          WHERE i.activo = TRUE AND ($1::int IS NULL OR i.id_categoria = $1) ORDER BY i.nombre`,
        [idCat],
      );
      return rows.map((r) => ({ ...r, alerta: r.stock_minimo > 0 && r.stock_actual < r.stock_minimo * 0.5 ? "Crítico" : r.stock_actual <= r.stock_minimo ? "Bajo" : "OK" }));
    }
    case "RPT-04": {
      const { rows } = await pool.query(
        `SELECT d.nombre_dependencia, c.nombre AS categoria, i.nombre AS insumo, um.simbolo AS unidad,
                SUM(dv.cantidad_salida)::int AS cantidad_total, COUNT(DISTINCT v.id_vale_salida)::int AS vales
           FROM vale_salida v JOIN detalle_vale_salida dv ON dv.id_vale_salida = v.id_vale_salida
           JOIN dependencia_municipal d ON d.id_dependencia = v.id_dependencia JOIN insumo i ON i.id_insumo = dv.id_insumo
           JOIN categoria c ON c.id_categoria = i.id_categoria JOIN unidad_medida um ON um.id_unidad_medida = i.id_unidad_medida
          WHERE v.estado = 'Entregado' AND ($1::date IS NULL OR v.fecha_salida >= $1) AND ($2::date IS NULL OR v.fecha_salida < $2::date + 1) AND ($3::int IS NULL OR v.id_dependencia = $3)
          GROUP BY d.nombre_dependencia, c.nombre, i.nombre, um.simbolo ORDER BY d.nombre_dependencia, cantidad_total DESC`,
        [fi, ff, idDep],
      );
      return rows;
    }
    case "RPT-05": {
      const { rows } = await pool.query(
        `SELECT r.codigo_requisicion, to_char(r.fecha_solicitud, 'DD/MM/YYYY') AS fecha_solicitud, d.nombre_dependencia,
                r.tipo_solicitud, r.prioridad, r.estado, COALESCE(r.monto_adjudicado, r.monto_estimado) AS monto
           FROM requisicion r JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
          WHERE ($1::int IS NULL OR r.id_dependencia = $1) AND ($2::text IS NULL OR r.estado = $2) AND ($3::text IS NULL OR r.prioridad = $3)
            AND ($4::date IS NULL OR r.fecha_solicitud >= $4) AND ($5::date IS NULL OR r.fecha_solicitud < $5::date + 1)
          ORDER BY r.fecha_solicitud DESC LIMIT 500`,
        [idDep, estado, prioridad, fi, ff],
      );
      return rows;
    }
    case "RPT-06": {
      const { rows } = await pool.query(
        `SELECT p.razon_social, p.nit, COUNT(*)::int AS ordenes, SUM(oc.monto_total)::numeric(12,2) AS monto_total,
                to_char(MIN(oc.fecha_emision), 'DD/MM/YYYY') AS primera, to_char(MAX(oc.fecha_emision), 'DD/MM/YYYY') AS ultima
           FROM orden_compra oc JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
          WHERE oc.estado <> 'Cancelada' AND ($1::date IS NULL OR oc.fecha_emision >= $1) AND ($2::date IS NULL OR oc.fecha_emision < $2::date + 1) AND ($3::int IS NULL OR oc.id_proveedor = $3)
          GROUP BY p.razon_social, p.nit ORDER BY monto_total DESC`,
        [fi, ff, idProv],
      );
      return rows;
    }
    case "RPT-08": {
      const { rows } = await pool.query(
        `SELECT oc.numero_orden, to_char(oc.fecha_emision, 'DD/MM/YYYY') AS fecha_emision, p.razon_social, oc.monto_total, oc.estado,
                (SELECT COUNT(*)::int FROM recepcion_bodega rb WHERE rb.id_orden_compra = oc.id_orden_compra) AS recepciones
           FROM orden_compra oc JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
          WHERE ($1::text IS NULL OR oc.estado = $1) AND ($2::date IS NULL OR oc.fecha_emision >= $2) AND ($3::date IS NULL OR oc.fecha_emision < $3::date + 1) AND ($4::int IS NULL OR oc.id_proveedor = $4)
          ORDER BY oc.fecha_emision DESC LIMIT 500`,
        [estado, fi, ff, idProv],
      );
      return rows;
    }
    case "RPT-09": {
      const { rows } = await pool.query(
        `SELECT rb.numero_comprobante, to_char(rb.fecha_recepcion, 'DD/MM/YYYY HH24:MI') AS fecha_recepcion, oc.numero_orden, p.razon_social, rb.estado,
                COALESCE((SELECT SUM(drb.cantidad_esperada) FROM detalle_recepcion_bodega drb WHERE drb.id_recepcion = rb.id_recepcion), 0) AS esperado,
                COALESCE((SELECT SUM(drb.cantidad_aceptada) FROM detalle_recepcion_bodega drb WHERE drb.id_recepcion = rb.id_recepcion), 0) AS aceptado
           FROM recepcion_bodega rb JOIN orden_compra oc ON oc.id_orden_compra = rb.id_orden_compra JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
          WHERE ($1::date IS NULL OR rb.fecha_recepcion >= $1) AND ($2::date IS NULL OR rb.fecha_recepcion < $2::date + 1) AND ($3::int IS NULL OR oc.id_proveedor = $3)
          ORDER BY rb.fecha_recepcion DESC LIMIT 500`,
        [fi, ff, idProv],
      );
      return rows;
    }
    case "RPT-11": {
      const { rows } = await pool.query(
        `SELECT p.razon_social AS name, COALESCE(SUM(oc.monto_total), 0)::numeric(12,2) AS value
           FROM proveedor p LEFT JOIN orden_compra oc ON oc.id_proveedor = p.id_proveedor AND oc.estado <> 'Cancelada'
          GROUP BY p.razon_social ORDER BY value DESC LIMIT 10`,
      );
      return rows;
    }
    default:
      return [];
  }
}

export default router;
