-- 023_requisicion_solo_pdf.sql  (PostgreSQL 15+)
-- Ajusta la tabla requisicion_imagen para que solo admita documentos PDF.
-- Aplica sobre instalaciones donde 022 ya fue ejecutado.

-- Normaliza el MIME por defecto para nuevos registros.
ALTER TABLE requisicion_imagen ALTER COLUMN mime_type SET DEFAULT 'application/pdf';

-- Normaliza registros existentes que no sean PDF (prototipo: se descartan).
DELETE FROM requisicion_imagen WHERE mime_type <> 'application/pdf';

-- Garantiza a nivel de base de datos que solo se guarden PDF.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'requisicion_imagen_solo_pdf'
  ) THEN
    ALTER TABLE requisicion_imagen
      ADD CONSTRAINT requisicion_imagen_solo_pdf CHECK (mime_type = 'application/pdf');
  END IF;
END $$;
