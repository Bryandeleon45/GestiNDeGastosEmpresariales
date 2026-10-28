-- 010_modulo_proveedores.sql  (PostgreSQL 15+)
-- Tablas base del módulo de Proveedores.
-- No existían como migración (la base original se creó fuera de esta carpeta),
-- por lo que 030 y siguientes fallaban al referenciar "proveedor".

CREATE TABLE IF NOT EXISTS tipo_proveedor (
  id_tipo_proveedor INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  descripcion       VARCHAR(100) NOT NULL UNIQUE,
  activo            BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO tipo_proveedor (descripcion, activo) VALUES
  ('Insumos Generales',       TRUE),
  ('Ferretería y Construcción', TRUE),
  ('Distribución General',    TRUE),
  ('Construcción',            TRUE)
ON CONFLICT (descripcion) DO NOTHING;

CREATE TABLE IF NOT EXISTS proveedor (
  id_proveedor         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_tipo_proveedor    INT NOT NULL REFERENCES tipo_proveedor(id_tipo_proveedor),
  nit                  VARCHAR(15) NOT NULL UNIQUE,
  razon_social         VARCHAR(100) NOT NULL,
  representante_legal  VARCHAR(100),
  nombre_contacto      VARCHAR(100),
  telefono_contacto    VARCHAR(8),
  telefono             VARCHAR(8),
  correo               VARCHAR(100) NOT NULL,
  direccion            VARCHAR(255),
  activo               BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro       TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT ck_proveedor_telefono
    CHECK (telefono IS NULL OR telefono ~ '^[0-9]{8}$'),
  CONSTRAINT ck_proveedor_telefono_contacto
    CHECK (telefono_contacto IS NULL OR telefono_contacto ~ '^[0-9]{8}$')
);

CREATE INDEX IF NOT EXISTS idx_proveedor_nombre ON proveedor (lower(razon_social));
CREATE INDEX IF NOT EXISTS idx_proveedor_tipo   ON proveedor (id_tipo_proveedor);

CREATE TABLE IF NOT EXISTS proveedor_usuario (
  id_proveedor_usuario INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_proveedor         INT NOT NULL REFERENCES proveedor(id_proveedor),
  id_usuario           INT NOT NULL UNIQUE REFERENCES usuario(id_usuario),
  es_principal         BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_conexion       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_proveedor_principal
  ON proveedor_usuario (id_proveedor)
  WHERE es_principal;
