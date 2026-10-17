-- 065_orden_pago_atraso.sql  (PostgreSQL 15+)
-- Permite marcar un pago como realizado con atraso cuando la factura venció.

ALTER TABLE orden_pago
  ADD COLUMN IF NOT EXISTS pagado_atraso BOOLEAN NOT NULL DEFAULT FALSE;

-- El estado visible distingue "Pagado" de "Pagado con atraso".
CREATE OR REPLACE VIEW v_factura_estado AS
SELECT f.id_factura, f.id_proveedor, f.numero_factura, f.fecha_emision, f.monto_total,
       f.fecha_vencimiento, f.estado AS estado_factura,
       op.id_orden_pago, op.estado AS estado_pago,
       CASE
         WHEN op.estado = 'Pagada' AND op.pagado_atraso THEN 'Pagado con atraso'
         WHEN op.estado = 'Pagada'                       THEN 'Pagado'
         WHEN f.estado = 'Rechazada'                     THEN 'Rechazada'
         WHEN f.fecha_vencimiento < CURRENT_DATE         THEN 'Vencido'
         ELSE 'Pendiente'
       END AS estado_visible
FROM factura f
LEFT JOIN orden_pago op ON op.id_factura = f.id_factura AND op.estado <> 'Anulada';
