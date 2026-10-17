-- 062_orden_compra_provisional.sql (PostgreSQL 15+)
-- Permite crear la orden de compra de forma provisional al momento de la
-- solicitud, antes de existir cotización y proveedor. El número de OC se
-- reserva desde el inicio y se conserva durante todo el proceso.

ALTER TABLE orden_compra
  ALTER COLUMN id_cotizacion DROP NOT NULL,
  ALTER COLUMN id_proveedor DROP NOT NULL;
