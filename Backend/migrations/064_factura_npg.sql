-- 064_factura_npg.sql  (PostgreSQL 15+)
-- Campos para el NPG (Nota de Pago) que se registran al aprobar la factura.

ALTER TABLE factura
  ADD COLUMN IF NOT EXISTS npg_pdf_nombre VARCHAR(150),
  ADD COLUMN IF NOT EXISTS npg_pdf_base64 TEXT;
