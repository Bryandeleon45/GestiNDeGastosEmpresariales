-- 063_monto_nivel_orden.sql  (PostgreSQL 15+)
-- El monto del sistema nace solo al cargar la factura (factura.monto_total).
-- Esta vista define el "recibido" a nivel de orden (valor = monto de la orden
-- cuando existe recepción) y deja de depender del precio unitario por ítem.

CREATE OR REPLACE VIEW v_recibido_oc AS
SELECT oc.id_orden_compra,
       CASE WHEN EXISTS (
          SELECT 1
            FROM recepcion_bodega rb
            JOIN detalle_recepcion_bodega drb ON drb.id_recepcion = rb.id_recepcion
           WHERE rb.id_orden_compra = oc.id_orden_compra
             AND rb.estado IN ('Completa','Parcial','Con Novedades')
             AND drb.cantidad_aceptada > 0
       ) THEN oc.monto_total ELSE 0 END::numeric(12,2) AS monto_recibido
  FROM orden_compra oc;

-- Backfill único: órdenes que ya tenían factura y quedaron en Q0.00.
UPDATE orden_compra oc
   SET monto_total = (SELECT COALESCE(SUM(f.monto_total), 0)
                        FROM factura f
                       WHERE f.id_orden_compra = oc.id_orden_compra
                         AND f.estado <> 'Rechazada')
 WHERE oc.monto_total = 0
   AND EXISTS (SELECT 1 FROM factura f WHERE f.id_orden_compra = oc.id_orden_compra);

UPDATE requisicion r
   SET monto_adjudicado = oc.monto_total,
       monto_estimado = CASE WHEN r.monto_estimado = 0 THEN oc.monto_total ELSE r.monto_estimado END
  FROM orden_compra oc
 WHERE oc.id_requisicion = r.id_requisicion
   AND oc.monto_total > 0;
