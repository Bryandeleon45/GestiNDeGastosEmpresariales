-- 022_imagenes_requisicion.sql  (PostgreSQL 15+)
-- Almacena las imágenes de "Solicitudes Autorizadas" asociadas a una
-- requisición. Las imágenes se guardan como base64 para simplificar el
-- prototipo (sin infraestructura de archivos ni de almacenamiento externo).

CREATE TABLE IF NOT EXISTS requisicion_imagen (
  id_imagen        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_requisicion   INT NOT NULL REFERENCES requisicion(id_requisicion) ON DELETE CASCADE,
  nombre_archivo   VARCHAR(255) NOT NULL,
  mime_type        VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
  contenido_base64 TEXT NOT NULL,
  fecha_registro   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_req_img ON requisicion_imagen (id_requisicion);
