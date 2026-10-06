-- 040_modulo_facturacion.sql  (PostgreSQL 15+)
-- Módulo de Facturación y Pagos — Municipalidad de Panajachel
-- Registro y revisión de facturas, órdenes de pago y cronograma.

-- Ajuste a Proformas: plazo de crédito numérico para calcular vencimiento.
ALTER TABLE orden_compra
  ADD COLUMN IF NOT EXISTS plazo_credito_dias INT CHECK (plazo_credito_dias >= 0);

CREATE TABLE partida_presupuestaria (
  id_partida  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo      VARCHAR(20)  NOT NULL UNIQUE,
  descripcion VARCHAR(150) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE fuente_financiamiento (
  id_fuente   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo      VARCHAR(20)  NOT NULL UNIQUE,
  descripcion VARCHAR(150) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE factura (
  id_factura          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_orden_compra     INT NOT NULL REFERENCES orden_compra(id_orden_compra),
  id_proveedor        INT NOT NULL REFERENCES proveedor(id_proveedor),
  serie               VARCHAR(20),
  numero_factura      VARCHAR(30) NOT NULL,
  numero_autorizacion VARCHAR(40),
  npg                 VARCHAR(20),
  fecha_emision       DATE NOT NULL,
  monto_total         NUMERIC(12,2) NOT NULL CHECK (monto_total > 0),
  plazo_credito_dias  INT NOT NULL DEFAULT 0 CHECK (plazo_credito_dias >= 0),
  fecha_vencimiento   DATE NOT NULL,
  estado              VARCHAR(15) NOT NULL DEFAULT 'Recibida'
                      CHECK (estado IN ('Recibida','En Revisión','Aprobada','Rechazada')),
  motivo_rechazo      VARCHAR(255),
  observaciones       TEXT,
  origen              VARCHAR(10) NOT NULL DEFAULT 'MANUAL' CHECK (origen IN ('PORTAL','MANUAL')),
  archivo_pdf_nombre  VARCHAR(150),
  archivo_pdf_base64  TEXT,
  archivo_xml_nombre  VARCHAR(150),
  archivo_xml_base64  TEXT,
  id_usuario_registra INT NOT NULL REFERENCES usuario(id_usuario),
  id_usuario_revisa   INT REFERENCES usuario(id_usuario),
  fecha_registro      TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_revision      TIMESTAMPTZ,
  CHECK (fecha_vencimiento >= fecha_emision),
  UNIQUE NULLS NOT DISTINCT (id_proveedor, serie, numero_factura)
);
CREATE UNIQUE INDEX uq_factura_autorizacion
  ON factura (numero_autorizacion) WHERE numero_autorizacion IS NOT NULL;

CREATE TABLE orden_pago (
  id_orden_pago         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero_orden_pago     VARCHAR(20) NOT NULL UNIQUE,
  id_factura            INT NOT NULL REFERENCES factura(id_factura),
  id_proveedor          INT NOT NULL REFERENCES proveedor(id_proveedor),
  concepto              VARCHAR(255) NOT NULL,
  monto                 NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  id_partida            INT REFERENCES partida_presupuestaria(id_partida),
  id_fuente             INT REFERENCES fuente_financiamiento(id_fuente),
  fecha_vencimiento     DATE NOT NULL,
  fecha_pago_programada DATE,
  fecha_pago_real       DATE,
  referencia_pago       VARCHAR(60),
  estado                VARCHAR(12) NOT NULL DEFAULT 'Pendiente'
                        CHECK (estado IN ('Pendiente','Programada','Pagada','Anulada')),
  motivo_anulacion      VARCHAR(255),
  id_usuario_crea       INT NOT NULL REFERENCES usuario(id_usuario),
  id_usuario_programa   INT REFERENCES usuario(id_usuario),
  id_usuario_paga       INT REFERENCES usuario(id_usuario),
  fecha_registro        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (estado <> 'Pagada' OR (fecha_pago_real IS NOT NULL AND referencia_pago IS NOT NULL))
);
CREATE UNIQUE INDEX uq_op_factura_vigente ON orden_pago (id_factura) WHERE estado <> 'Anulada';

CREATE INDEX idx_factura_estado       ON factura (estado);
CREATE INDEX idx_factura_vencimiento  ON factura (fecha_vencimiento);
CREATE INDEX idx_factura_oc           ON factura (id_orden_compra);
CREATE INDEX idx_op_estado_venc       ON orden_pago (estado, fecha_vencimiento);

CREATE VIEW v_factura_estado AS
SELECT f.id_factura, f.id_proveedor, f.numero_factura, f.fecha_emision, f.monto_total,
       f.fecha_vencimiento, f.estado AS estado_factura,
       op.id_orden_pago, op.estado AS estado_pago,
       CASE
         WHEN op.estado = 'Pagada'          THEN 'Pagado'
         WHEN f.estado  = 'Rechazada'       THEN 'Rechazada'
         WHEN f.fecha_vencimiento < CURRENT_DATE THEN 'Vencido'
         ELSE 'Pendiente'
       END AS estado_visible
FROM factura f
LEFT JOIN orden_pago op ON op.id_factura = f.id_factura AND op.estado <> 'Anulada';

-- Semillas: partidas y fuentes de ejemplo (DAFIM proveerá el catálogo real).
INSERT INTO partida_presupuestaria (codigo, descripcion) VALUES
  ('189', 'Otros estudios y/o servicios'),
  ('269', 'Materiales y suministros'),
  ('291', 'Mobiliario y equipo'),
  ('189-1', 'Mantenimiento de instalaciones')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO fuente_financiamiento (codigo, descripcion) VALUES
  ('INGRESOS', 'Ingresos Propios'),
  ('APORTE', 'Aporte Constitucional'),
  ('FONDO', 'Fondo de Desarrollo')
ON CONFLICT (codigo) DO NOTHING;

-- Permisos: roles que gestionan facturación.
INSERT INTO permiso (id_rol, id_submenu, activo)
SELECT r.id_rol, s.id_submenu, TRUE
FROM rol r
CROSS JOIN submenu s
WHERE s.controlador = 'facturacion'
  AND r.nombre_rol IN ('Administrador General','Encargado de Compras','Encargado de Almacén','DAFIM','Alcalde Municipal')
ON CONFLICT (id_rol, id_submenu) DO NOTHING;
