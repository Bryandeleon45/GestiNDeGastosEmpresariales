import { pool } from "../db.js";
import { enviarA, usuariosPorModulo } from "./notificaciones.service.js";
import { emitir } from "./eventos.js";

// Detección de alertas de estado (no de eventos puntuales): recorre el sistema
// y genera una notificación por cada condición que aún no tenga un aviso en las
// últimas 24 horas. Se ejecuta al arrancar y cada minuto desde index.js.

const VENTANA_HORAS = 24;

export async function alertarStockBajo() {
  const { rows } = await pool.query(
    `SELECT ib.id_insumo, ib.id_bodega, i.nombre AS nombre_insumo,
            ib.stock_actual, ib.stock_minimo, b.nombre_bodega
       FROM insumo_bodega ib
       JOIN insumo i ON i.id_insumo = ib.id_insumo
       JOIN bodega b ON b.id_bodega = ib.id_bodega
      WHERE i.activo = TRUE
        AND ib.stock_minimo > 0
        AND ib.stock_actual <= ib.stock_minimo
        AND NOT EXISTS (
          SELECT 1 FROM notificacion n
           WHERE n.tipo = 'STOCK_BAJO'
             AND n.referencia = ib.id_insumo || '-' || ib.id_bodega
             AND n.fecha > now() - ($1 * interval '1 hour'))`,
    [VENTANA_HORAS],
  );
  if (!rows.length) return 0;

  const destinos = await usuariosPorModulo(["bodega"]);
  let enviadas = 0;
  for (const r of rows) {
    const criticidad = r.stock_actual < r.stock_minimo * 0.5 ? "Crítico" : "Bajo";
    enviadas += await enviarA({
      ids: destinos,
      tipo: "STOCK_BAJO",
      titulo: `Stock ${criticidad.toLowerCase()}: ${r.nombre_insumo}`,
      mensaje: `Quedan ${r.stock_actual} unidades en ${r.nombre_bodega} (mínimo ${r.stock_minimo}).`,
      referencia: `${r.id_insumo}-${r.id_bodega}`,
      ventanaHoras: VENTANA_HORAS,
    });
  }
  return enviadas;
}

export async function alertarVencimientosFactura() {
  const { rows } = await pool.query(
    `SELECT f.id_factura, f.serie, f.numero_factura, f.fecha_vencimiento,
            f.monto_total, p.razon_social
       FROM factura f
       JOIN proveedor p ON p.id_proveedor = f.id_proveedor
      WHERE f.fecha_vencimiento IS NOT NULL
        AND f.fecha_vencimiento <= CURRENT_DATE + 7
        AND NOT EXISTS (
          SELECT 1 FROM orden_pago op
           WHERE op.id_factura = f.id_factura AND op.estado = 'Pagada')
        AND NOT EXISTS (
          SELECT 1 FROM notificacion n
           WHERE n.tipo IN ('FACTURA_VENCIDA', 'FACTURA_POR_VENCER')
             AND n.referencia = 'F-' || f.id_factura
             AND n.fecha > now() - ($1 * interval '1 hour'))`,
    [VENTANA_HORAS],
  );
  if (!rows.length) return 0;

  const destinos = await usuariosPorModulo(["facturacion"]);
  const hoy = new Date().toISOString().slice(0, 10);
  let enviadas = 0;
  for (const f of rows) {
    const vencida = f.fecha_vencimiento < hoy;
    const numero = `${f.serie ? f.serie + "-" : ""}${f.numero_factura}`;
    enviadas += await enviarA({
      ids: destinos,
      tipo: vencida ? "FACTURA_VENCIDA" : "FACTURA_POR_VENCER",
      titulo: vencida ? `Factura vencida: ${numero}` : `Factura por vencer: ${numero}`,
      mensaje: vencida
        ? `${f.razon_social}: factura ${numero} venció el ${f.fecha_vencimiento} (Q ${f.monto_total}).`
        : `${f.razon_social}: factura ${numero} vence el ${f.fecha_vencimiento} (Q ${f.monto_total}).`,
      referencia: `F-${f.id_factura}`,
      ventanaHoras: VENTANA_HORAS,
    });
  }
  return enviadas;
}

export async function sincronizarAlertas() {
  const stock = await alertarStockBajo();
  const facturas = await alertarVencimientosFactura();
  if (stock || facturas) emitir("ALERTAS_GENERADAS", { stock, facturas });
  return { stock, facturas };
}
