-- 022_imagenes_requisicion.sql  (PostgreSQL 15+)
-- Almacena los documentos PDF de "Solicitudes Autorizadas" asociados a una
-- requisición. Los PDF se guardan como base64 para simplificar el
-- prototipo (sin infraestructura de archivos ni de almacenamiento externo).

CREATE TABLE IF NOT EXISTS requisicion_imagen (
  id_imagen        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_requisicion   INT NOT NULL REFERENCES requisicion(id_requisicion) ON DELETE CASCADE,
  nombre_archivo   VARCHAR(255) NOT NULL,
  mime_type        VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  contenido_base64 TEXT NOT NULL,
  fecha_registro   TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT requisicion_imagen_solo_pdf CHECK (mime_type = 'application/pdf')
);

CREATE INDEX idx_req_img ON requisicion_imagen (id_requisicion);
