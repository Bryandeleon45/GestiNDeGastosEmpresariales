-- 030_modulo_proformas.sql  (PostgreSQL 15+)
-- Módulo de Proformas — Municipalidad de Panajachel
-- Proceso de cotización, comparativa, adjudicación y orden de compra.

-- Ajuste a Dependencias: monto final de la compra adjudicada
ALTER TABLE requisicion ADD COLUMN IF NOT EXISTS monto_adjudicado NUMERIC(12,2);

CREATE TABLE proceso_cotizacion (
  id_proceso          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_requisicion      INT NOT NULL UNIQUE REFERENCES requisicion(id_requisicion),
  fase                VARCHAR(15) NOT NULL DEFAULT 'Publicada'
                      CHECK (fase IN ('Publicada','Comparación','Adjudicada','Desierta')),
  fecha_publicacion   TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_limite        TIMESTAMPTZ NOT NULL,
  min_ofertas         INT NOT NULL DEFAULT 3 CHECK (min_ofertas >= 1),
  motivo_adjudicacion TEXT,
  id_usuario_publica  INT NOT NULL REFERENCES usuario(id_usuario),
  id_usuario_adjudica INT REFERENCES usuario(id_usuario),
  fecha_adjudicacion  TIMESTAMPTZ,
  CHECK (fecha_limite > fecha_publicacion)
);

CREATE TABLE invitacion_proveedor (
  id_invitacion    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_proceso       INT NOT NULL REFERENCES proceso_cotizacion(id_proceso) ON DELETE CASCADE,
  id_proveedor     INT NOT NULL REFERENCES proveedor(id_proveedor),
  fecha_invitacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_vista      TIMESTAMPTZ,
  UNIQUE (id_proceso, id_proveedor)
);

CREATE TABLE cotizacion (
  id_cotizacion          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_requisicion         INT NOT NULL REFERENCES requisicion(id_requisicion),
  id_proveedor           INT NOT NULL REFERENCES proveedor(id_proveedor),
  numero_cotizacion      VARCHAR(20) NOT NULL UNIQUE,
  referencia_proveedor   VARCHAR(30),
  fecha_cotizacion       DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_validez          DATE,
  monto_total            NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto_total >= 0),
  condiciones_pago       VARCHAR(255),
  tiempo_entrega_dias    INT CHECK (tiempo_entrega_dias >= 0),
  tiempo_entrega_texto   VARCHAR(50),
  estado_cotizacion      VARCHAR(15) NOT NULL DEFAULT 'Recibida'
                         CHECK (estado_cotizacion IN ('Recibida','En Evaluación','Aceptada','Rechazada')),
  cumple_tecnico         BOOLEAN,
  observaciones_tecnicas TEXT,
  seleccionada           BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_rechazo         VARCHAR(255),
  origen                 VARCHAR(10) NOT NULL DEFAULT 'PORTAL' CHECK (origen IN ('PORTAL','MANUAL')),
  id_usuario_registra    INT NOT NULL REFERENCES usuario(id_usuario),
  fecha_registro         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id_requisicion, id_proveedor)
);
CREATE UNIQUE INDEX uq_cot_seleccionada ON cotizacion (id_requisicion) WHERE seleccionada;
CREATE UNIQUE INDEX uq_cot_aceptada     ON cotizacion (id_requisicion) WHERE estado_cotizacion = 'Aceptada';

CREATE TABLE detalle_cotizacion (
  id_detalle_cotizacion  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_cotizacion          INT NOT NULL REFERENCES cotizacion(id_cotizacion) ON DELETE CASCADE,
  id_detalle_requisicion INT NOT NULL REFERENCES detalle_requisicion(id_detalle),
  cantidad_cotizada      NUMERIC(12,2) NOT NULL CHECK (cantidad_cotizada > 0),
  precio_unitario        NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal               NUMERIC(14,2) GENERATED ALWAYS AS (cantidad_cotizada * precio_unitario) STORED,
  descripcion_oferta     VARCHAR(150),
  UNIQUE (id_cotizacion, id_detalle_requisicion)
);

CREATE TABLE orden_compra (
  id_orden_compra        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero_orden           VARCHAR(20) NOT NULL UNIQUE,
  id_requisicion         INT NOT NULL REFERENCES requisicion(id_requisicion),
  id_cotizacion          INT NOT NULL UNIQUE REFERENCES cotizacion(id_cotizacion),
  id_proveedor           INT NOT NULL REFERENCES proveedor(id_proveedor),
  fecha_emision          TIMESTAMP NOT NULL DEFAULT now(),
  fecha_entrega_estimada DATE,
  monto_total            NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto_total >= 0),
  estado                 VARCHAR(15) NOT NULL DEFAULT 'Pendiente'
                         CHECK (estado IN ('Pendiente','Aprobada','Enviada','Entregada','Cancelada')),
  id_usuario_emite       INT NOT NULL REFERENCES usuario(id_usuario),
  id_usuario_aprobador   INT REFERENCES usuario(id_usuario),
  fecha_aprobacion       TIMESTAMP
);

CREATE TABLE detalle_orden_compra (
  id_detalle_orden       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_orden_compra        INT NOT NULL REFERENCES orden_compra(id_orden_compra) ON DELETE CASCADE,
  id_detalle_requisicion INT NOT NULL REFERENCES detalle_requisicion(id_detalle),
  cantidad_comprada      NUMERIC(12,2) NOT NULL CHECK (cantidad_comprada > 0),
  precio_unitario        NUMERIC(12,2) NOT NULL,
  subtotal               NUMERIC(14,2) GENERATED ALWAYS AS (cantidad_comprada * precio_unitario) STORED
);

CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario      INT NOT NULL REFERENCES usuario(id_usuario),
  tipo            VARCHAR(30) NOT NULL,
  titulo          VARCHAR(100) NOT NULL,
  mensaje         VARCHAR(255),
  referencia      VARCHAR(50),
  leida           BOOLEAN NOT NULL DEFAULT FALSE,
  fecha           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cot_requisicion ON cotizacion (id_requisicion);
CREATE INDEX idx_cot_proveedor   ON cotizacion (id_proveedor);
CREATE INDEX idx_oc_estado       ON orden_compra (estado);
CREATE INDEX idx_invitacion_prov ON invitacion_proveedor (id_proveedor);
CREATE INDEX idx_notif_usuario   ON notificacion (id_usuario, leida);

-- Permisos: los roles que gestionan proformas acceden al submenú "Proformas".
INSERT INTO permiso (id_rol, id_submenu, activo)
SELECT r.id_rol, s.id_submenu, TRUE
FROM rol r
CROSS JOIN submenu s
WHERE s.controlador = 'proformas'
  AND r.nombre_rol IN ('Administrador General','Encargado de Compras','Encargado de Almacén','DAFIM','Alcalde Municipal')
ON CONFLICT (id_rol, id_submenu) DO NOTHING;
