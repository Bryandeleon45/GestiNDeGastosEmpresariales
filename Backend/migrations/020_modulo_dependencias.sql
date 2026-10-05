-- 020_modulo_dependencias.sql  (PostgreSQL 15+)
-- Módulo de Dependencias y Solicitudes — Municipalidad de Panajachel

-- Catálogos mínimos de insumos (se ampliarán en módulo Bodega)
CREATE TABLE IF NOT EXISTS categoria (
  id_categoria   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL UNIQUE,
  descripcion    TEXT,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unidad_medida (
  id_unidad_medida INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre           VARCHAR(50) NOT NULL UNIQUE,
  simbolo          VARCHAR(10),
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insumo (
  id_insumo        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_categoria     INT NOT NULL REFERENCES categoria(id_categoria),
  id_unidad_medida INT NOT NULL REFERENCES unidad_medida(id_unidad_medida),
  codigo_insumo    VARCHAR(30) NOT NULL UNIQUE,
  nombre           VARCHAR(150) NOT NULL,
  descripcion      TEXT,
  precio_referencial NUMERIC(12,2) NOT NULL DEFAULT 0,
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro   TIMESTAMP NOT NULL DEFAULT now()
);

-- Datos semilla para catálogos mínimos
INSERT INTO categoria (nombre, descripcion) VALUES
  ('Materiales de Oficina', 'Papelería, útiles de escritorio, consumibles'),
  ('Materiales de Construcción', 'Cemento, arena, block, varilla, acabados'),
  ('Materiales Eléctricos', 'Cable, tubería, interruptores, luminarias'),
  ('Materiales de Plomería', 'Tubería, conexiones, válvulas, sanitarios'),
  ('Equipos de Cómputo', 'Computadoras, impresoras, periféricos, accesorios'),
  ('Mobiliario', 'Escritorios, sillas, archivadores, estantería'),
  ('Herramientas', 'Manuales, eléctricas, de medición'),
  ('Insumos Médicos', 'Material de curación, medicamentos, equipos básicos'),
  ('Limpieza y Mantenimiento', 'Detergentes, desinfectantes, bolsas, escobas'),
  ('Otros', 'Insumos varios no clasificados')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO unidad_medida (nombre, simbolo) VALUES
  ('Unidad', 'UND'),
  ('Metro', 'M'),
  ('Metro Cuadrado', 'M2'),
  ('Metro Cúbico', 'M3'),
  ('Kilogramo', 'KG'),
  ('Litro', 'LT'),
  ('Caja', 'CAJ'),
  ('Paquete', 'PAQ'),
  ('Rollo', 'ROL'),
  ('Juego', 'JUE')
ON CONFLICT (nombre) DO NOTHING;

-- Ajustes al catálogo de dependencias
ALTER TABLE dependencia_municipal
  ADD COLUMN IF NOT EXISTS siglas VARCHAR(10) UNIQUE;

CREATE TABLE periodo_fiscal (
  id_periodo   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  anio         INT NOT NULL UNIQUE,
  activo       BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE UNIQUE INDEX uq_periodo_activo ON periodo_fiscal (activo) WHERE activo;

CREATE TABLE presupuesto_dependencia (
  id_presupuesto INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_dependencia INT NOT NULL REFERENCES dependencia_municipal(id_dependencia),
  id_periodo     INT NOT NULL REFERENCES periodo_fiscal(id_periodo),
  monto_asignado NUMERIC(12,2) NOT NULL CHECK (monto_asignado >= 0),
  UNIQUE (id_dependencia, id_periodo)
);

CREATE TABLE requisicion (
  id_requisicion     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo_requisicion VARCHAR(20) NOT NULL UNIQUE,
  id_usuario         INT NOT NULL REFERENCES usuario(id_usuario),
  id_dependencia     INT NOT NULL REFERENCES dependencia_municipal(id_dependencia),
  id_periodo         INT NOT NULL REFERENCES periodo_fiscal(id_periodo),
  tipo_solicitud     VARCHAR(40) NOT NULL DEFAULT 'Compra de Materiales',
  justificacion      TEXT NOT NULL,
  lugar_entrega      VARCHAR(150),
  prioridad          VARCHAR(10) NOT NULL DEFAULT 'Media'
                     CHECK (prioridad IN ('Baja','Media','Alta','Urgente')),
  estado             VARCHAR(15) NOT NULL DEFAULT 'Pendiente'
                     CHECK (estado IN ('Pendiente','En Revisión','Aprobada','Rechazada','En Compra','Cancelada')),
  monto_estimado     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto_estimado >= 0),
  notas_aprobacion   TEXT,
  id_usuario_revisor INT REFERENCES usuario(id_usuario),
  fecha_solicitud    TIMESTAMP NOT NULL DEFAULT now(),
  fecha_resolucion   TIMESTAMP
);

CREATE TABLE detalle_requisicion (
  id_detalle         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_requisicion     INT NOT NULL REFERENCES requisicion(id_requisicion) ON DELETE CASCADE,
  id_insumo          INT REFERENCES insumo(id_insumo),
  descripcion_libre  VARCHAR(150),
  id_unidad_medida   INT NOT NULL REFERENCES unidad_medida(id_unidad_medida),
  cantidad           NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
  precio_estimado    NUMERIC(12,2) NOT NULL DEFAULT 0,
  observaciones      VARCHAR(255),
  CHECK (id_insumo IS NOT NULL OR descripcion_libre IS NOT NULL)
);

CREATE INDEX idx_req_dependencia ON requisicion (id_dependencia, fecha_solicitud DESC);
CREATE INDEX idx_req_estado      ON requisicion (estado);
CREATE INDEX idx_det_req         ON detalle_requisicion (id_requisicion);

-- Datos semilla para desarrollo
INSERT INTO periodo_fiscal (anio, activo) VALUES (2026, TRUE) ON CONFLICT DO NOTHING;

-- Actualizar siglas de dependencias existentes
UPDATE dependencia_municipal SET siglas = 'DMP' WHERE nombre_dependencia = 'DMP';
UPDATE dependencia_municipal SET siglas = 'DAFIM' WHERE nombre_dependencia = 'DAFIM';
UPDATE dependencia_municipal SET siglas = 'DMM' WHERE nombre_dependencia = 'DMM';
UPDATE dependencia_municipal SET siglas = 'OMSAN' WHERE nombre_dependencia = 'OMSAN';
UPDATE dependencia_municipal SET siglas = 'DIGAM' WHERE nombre_dependencia = 'DIGAM';
UPDATE dependencia_municipal SET siglas = 'SECR' WHERE nombre_dependencia = 'Secretaría';
UPDATE dependencia_municipal SET siglas = 'DESP' WHERE nombre_dependencia = 'Despacho';
UPDATE dependencia_municipal SET siglas = 'COMP' WHERE nombre_dependencia = 'Compras y Almacén';

-- Presupuesto de ejemplo por dependencia (período 2026 activo)
INSERT INTO presupuesto_dependencia (id_dependencia, id_periodo, monto_asignado)
SELECT d.id_dependencia, p.id_periodo,
  CASE d.nombre_dependencia
    WHEN 'DMP' THEN 500000.00
    WHEN 'DAFIM' THEN 800000.00
    WHEN 'DMM' THEN 400000.00
    WHEN 'OMSAN' THEN 300000.00
    WHEN 'DIGAM' THEN 350000.00
    WHEN 'Secretaría' THEN 200000.00
    WHEN 'Despacho' THEN 150000.00
    WHEN 'Compras y Almacén' THEN 600000.00
    ELSE 100000.00
  END
FROM dependencia_municipal d
CROSS JOIN (SELECT id_periodo FROM periodo_fiscal WHERE activo = TRUE) p
ON CONFLICT (id_dependencia, id_periodo) DO NOTHING;