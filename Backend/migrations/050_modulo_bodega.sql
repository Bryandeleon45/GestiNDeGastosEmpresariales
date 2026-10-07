-- 050_modulo_bodega.sql  (PostgreSQL 15+)
-- Módulo de Bodega y Recepción — Municipalidad de Panajachel
-- Adaptado al esquema existente (categoria, unidad_medida, insumo,
-- orden_compra, detalle_orden_compra, usuario, dependencia_municipal).

CREATE TABLE bodega (
  id_bodega     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_bodega VARCHAR(100) NOT NULL,
  ubicacion     VARCHAR(255),
  encargado     VARCHAR(100),
  activo        BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE insumo_bodega (
  id_insumo    INT NOT NULL REFERENCES insumo(id_insumo),
  id_bodega    INT NOT NULL REFERENCES bodega(id_bodega),
  stock_actual INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo INT NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  PRIMARY KEY (id_insumo, id_bodega)
);

CREATE TABLE recepcion_bodega (
  id_recepcion       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_orden_compra    INT NOT NULL REFERENCES orden_compra(id_orden_compra),
  id_bodega          INT NOT NULL REFERENCES bodega(id_bodega),
  id_usuario         INT NOT NULL REFERENCES usuario(id_usuario),
  numero_comprobante VARCHAR(30) NOT NULL UNIQUE,
  fecha_recepcion    TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado             VARCHAR(20) NOT NULL DEFAULT 'En Proceso'
    CHECK (estado IN ('En Proceso','Completa','Parcial','Con Novedades','Cancelada')),
  observaciones      TEXT
);

CREATE TABLE detalle_recepcion_bodega (
  id_detalle_recepcion INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_recepcion         INT NOT NULL REFERENCES recepcion_bodega(id_recepcion) ON DELETE CASCADE,
  id_detalle_orden     INT NOT NULL REFERENCES detalle_orden_compra(id_detalle_orden),
  id_insumo            INT NOT NULL REFERENCES insumo(id_insumo),
  cantidad_esperada    INT NOT NULL CHECK (cantidad_esperada > 0),
  cantidad_recibida    INT NOT NULL DEFAULT 0 CHECK (cantidad_recibida >= 0),
  cantidad_aceptada    INT NOT NULL DEFAULT 0 CHECK (cantidad_aceptada >= 0),
  estado_item          VARCHAR(12) NOT NULL DEFAULT 'Pendiente'
    CHECK (estado_item IN ('Pendiente','Recibido','Rechazado','Faltante')),
  observacion          VARCHAR(255),
  CHECK (cantidad_aceptada <= cantidad_recibida),
  UNIQUE (id_recepcion, id_detalle_orden)
);

CREATE TABLE vale_salida (
  id_vale_salida         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_dependencia         INT NOT NULL REFERENCES dependencia_municipal(id_dependencia),
  id_usuario_solicitante INT NOT NULL REFERENCES usuario(id_usuario),
  id_usuario_autoriza    INT REFERENCES usuario(id_usuario),
  fecha_salida           TIMESTAMPTZ NOT NULL DEFAULT now(),
  justificacion          TEXT,
  estado                 VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
    CHECK (estado IN ('Pendiente','Autorizado','Entregado','Cancelado'))
);

CREATE TABLE detalle_vale_salida (
  id_detalle_vale INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_vale_salida  INT NOT NULL REFERENCES vale_salida(id_vale_salida) ON DELETE CASCADE,
  id_insumo       INT NOT NULL REFERENCES insumo(id_insumo),
  cantidad_salida INT NOT NULL CHECK (cantidad_salida > 0),
  observacion     VARCHAR(255)
);

CREATE TABLE kardex (
  id_kardex        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_insumo        INT NOT NULL REFERENCES insumo(id_insumo),
  id_bodega        INT NOT NULL REFERENCES bodega(id_bodega),
  id_recepcion     INT REFERENCES recepcion_bodega(id_recepcion),
  id_vale_salida   INT REFERENCES vale_salida(id_vale_salida),
  id_usuario       INT NOT NULL REFERENCES usuario(id_usuario),
  tipo_movimiento  VARCHAR(10) NOT NULL CHECK (tipo_movimiento IN ('Entrada','Salida','Ajuste')),
  cantidad         INT NOT NULL CHECK (cantidad > 0),
  stock_anterior   INT NOT NULL,
  stock_actual     INT NOT NULL CHECK (stock_actual >= 0),
  fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (tipo_movimiento = 'Entrada' AND id_recepcion IS NOT NULL) OR
    (tipo_movimiento = 'Salida'  AND id_vale_salida IS NOT NULL) OR
    (tipo_movimiento = 'Ajuste')
  )
);
CREATE INDEX ix_kardex_insumo_fecha ON kardex (id_insumo, fecha_movimiento DESC);

CREATE FUNCTION kardex_inmutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'El Kardex no admite UPDATE ni DELETE; corrija con un movimiento de ajuste';
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kardex_inmutable
  BEFORE UPDATE OR DELETE ON kardex
  FOR EACH ROW EXECUTE FUNCTION kardex_inmutable();

-- ── Semillas ─────────────────────────────────────────────────────────────────
INSERT INTO bodega (nombre_bodega, ubicacion, encargado, activo) VALUES
  ('Almacén Municipal', 'Bodega Central', 'Encargado de Almacén', TRUE)
ON CONFLICT DO NOTHING;

-- Insumos de ejemplo (vinculados a categorías y unidades existentes)
INSERT INTO insumo (id_categoria, id_unidad_medida, codigo_insumo, nombre, descripcion, precio_referencial) VALUES
  (1, 1, 'IN-001', 'Papel Bond Carta 80g', 'Resma de 500 hojas', 45.00),
  (1, 1, 'IN-002', 'Tóner HP Laser 58A', 'Original, Negro', 850.00),
  (1, 1, 'IN-003', 'Archivador de Palanca', 'Lomo ancho, azul', 28.00),
  (1, 1, 'IN-004', 'Bolígrafo Azul', 'Caja de 12 unidades', 15.00),
  (9, 1, 'IN-005', 'Detergente Líquido', 'Galón de limpieza', 60.00),
  (9, 1, 'IN-006', 'Bolsa de Basura Negra', 'Paquete de 50', 25.00),
  (2, 3, 'IN-007', 'Cemento Portland', 'Bolsa de 42.5 kg', 75.00),
  (2, 1, 'IN-008', 'Block de Concreto', 'Block estándar 14x19x39', 6.50),
  (3, 2, 'IN-009', 'Cable THHN #12', 'Rollo de 100 metros', 320.00),
  (3, 1, 'IN-010', 'Luminaria LED', 'Lámpara de 40W', 90.00),
  (4, 2, 'IN-011', 'Tubería PVC 1/2"', 'Tubo de 6 metros', 45.00),
  (4, 1, 'IN-012', 'Válvula de Bola', 'Válvula de bronce 1/2"', 55.00),
  (5, 1, 'IN-013', 'Computadora de Escritorio', 'Equipo básico', 4200.00),
  (6, 1, 'IN-014', 'Silla de Oficina', 'Silla ergonómica', 750.00),
  (7, 1, 'IN-015', 'Juego de Herramientas', 'Set de 20 piezas', 480.00)
ON CONFLICT (codigo_insumo) DO NOTHING;

-- Stock inicial (movimiento de ajuste conceptual; solo carga de saldos)
INSERT INTO insumo_bodega (id_insumo, id_bodega, stock_actual, stock_minimo)
SELECT i.id_insumo, b.id_bodega, 0, 0
FROM insumo i CROSS JOIN bodega b
WHERE i.codigo_insumo IN ('IN-001','IN-002','IN-003','IN-004','IN-005','IN-006','IN-007','IN-008','IN-009','IN-010','IN-011','IN-012','IN-013','IN-014','IN-015')
ON CONFLICT (id_insumo, id_bodega) DO NOTHING;

-- Stock inicial de ejemplo (saldos de arranque) vía ajuste en kardex
INSERT INTO insumo_bodega (id_insumo, id_bodega, stock_actual, stock_minimo)
VALUES
  ((SELECT id_insumo FROM insumo WHERE codigo_insumo='IN-001'), 1, 12, 50),
  ((SELECT id_insumo FROM insumo WHERE codigo_insumo='IN-002'), 1, 4, 5),
  ((SELECT id_insumo FROM insumo WHERE codigo_insumo='IN-003'), 1, 30, 20),
  ((SELECT id_insumo FROM insumo WHERE codigo_insumo='IN-004'), 1, 80, 50),
  ((SELECT id_insumo FROM insumo WHERE codigo_insumo='IN-005'), 1, 15, 20),
  ((SELECT id_insumo FROM insumo WHERE codigo_insumo='IN-006'), 1, 10, 30)
ON CONFLICT (id_insumo, id_bodega) DO UPDATE SET stock_actual = EXCLUDED.stock_actual, stock_minimo = EXCLUDED.stock_minimo;

-- Permisos del submenú Bodega
INSERT INTO permiso (id_rol, id_submenu, activo)
SELECT r.id_rol, s.id_submenu, TRUE
FROM rol r
CROSS JOIN submenu s
WHERE s.controlador = 'bodega'
  AND r.nombre_rol IN ('Administrador General','Encargado de Almacén','Encargado de Compras','DAFIM','Alcalde Municipal')
ON CONFLICT (id_rol, id_submenu) DO NOTHING;
