-- 080_configuracion.sql  (PostgreSQL 15+)
-- Módulo de Configuración (Gestión Administrativa) — Municipalidad de Panajachel
-- Ejecutar DESPUÉS de 001..066 (depende de usuario, empleado, dependencia,
-- periodo_fiscal, permiso y bitacora_acceso).
--
-- Nota: parametro_sistema y dia_inhabil no existían (el plan los referenciaba
-- como creados en "070", que nunca se migró), por lo que aquí se CREAN.

-- 1) Identidad visual institucional (una sola fila)
CREATE TABLE IF NOT EXISTS identidad_institucional (
  id_identidad         SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id_identidad = 1),
  nombre_institucion   VARCHAR(120) NOT NULL DEFAULT 'Municipalidad de Panajachel',
  nombre_corto         VARCHAR(40)  NOT NULL DEFAULT 'Muni Panajachel',
  nombre_sistema       VARCHAR(120) NOT NULL DEFAULT 'Sistema de Gestión Municipal y Cadena de Suministros',
  subtitulo_gestion    VARCHAR(60)  NOT NULL DEFAULT 'Gestión Administrativa',
  subtitulo_portal     VARCHAR(60)  NOT NULL DEFAULT 'Portal de Proveedores',
  lema                 VARCHAR(150),
  nit_institucional    VARCHAR(15),
  direccion            VARCHAR(200),
  telefono             VARCHAR(20),
  correo_contacto      VARCHAR(100),
  color_principal      VARCHAR(7) NOT NULL DEFAULT '#1B5E30'
                       CHECK (color_principal ~ '^#[0-9A-Fa-f]{6}$'),
  colores_acento       VARCHAR(100) NOT NULL
                       DEFAULT '#1B5E30,#1D4ED8,#7C3AED,#B45309,#0F766E,#BE123C',
  logo                 BYTEA,
  logo_mime            VARCHAR(30),
  imagen_login         BYTEA,
  imagen_login_mime    VARCHAR(30),
  fecha_actualizacion  TIMESTAMPTZ NOT NULL DEFAULT now(),
  id_usuario_actualiza INT REFERENCES usuario(id_usuario)
);
INSERT INTO identidad_institucional DEFAULT VALUES ON CONFLICT (id_identidad) DO NOTHING;

-- 2) Período fiscal: fechas y cierre
ALTER TABLE periodo_fiscal
  ADD COLUMN IF NOT EXISTS fecha_inicio      DATE,
  ADD COLUMN IF NOT EXISTS fecha_fin         DATE,
  ADD COLUMN IF NOT EXISTS cerrado           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fecha_cierre      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS id_usuario_cierre INT REFERENCES usuario(id_usuario);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_periodo_fechas') THEN
    ALTER TABLE periodo_fiscal ADD CONSTRAINT ck_periodo_fechas
      CHECK (fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_fin >= fecha_inicio);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_periodo_estado') THEN
    ALTER TABLE periodo_fiscal ADD CONSTRAINT ck_periodo_estado
      CHECK (NOT (activo AND cerrado));
  END IF;
END $$;

-- 3) Dependencias y empleados
ALTER TABLE dependencia_municipal
  ADD COLUMN IF NOT EXISTS id_empleado_responsable INT REFERENCES empleado(id_empleado);
ALTER TABLE empleado ADD COLUMN IF NOT EXISTS extension VARCHAR(6);

-- 4) Preferencias: foto de perfil
ALTER TABLE usuario_preferencia
  ADD COLUMN IF NOT EXISTS foto                BYTEA,
  ADD COLUMN IF NOT EXISTS foto_mime           VARCHAR(30),
  ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now();

-- 5) Parámetros del sistema (tabla nueva)
CREATE TABLE IF NOT EXISTS parametro_sistema (
  clave                VARCHAR(40) PRIMARY KEY,
  valor                VARCHAR(100) NOT NULL,
  descripcion          VARCHAR(255),
  grupo                VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
  tipo                 VARCHAR(10) NOT NULL DEFAULT 'TEXTO'
                       CHECK (tipo IN ('ENTERO','DECIMAL','TEXTO','BOOLEANO','LISTA')),
  valor_min            NUMERIC,
  valor_max            NUMERIC,
  opciones             VARCHAR(255),
  orden                INT NOT NULL DEFAULT 0,
  fecha_actualizacion  TIMESTAMPTZ NOT NULL DEFAULT now(),
  id_usuario_actualiza INT REFERENCES usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS parametro_historial (
  id_historial   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clave          VARCHAR(40) NOT NULL REFERENCES parametro_sistema(clave),
  valor_anterior VARCHAR(100),
  valor_nuevo    VARCHAR(100) NOT NULL,
  id_usuario     INT NOT NULL REFERENCES usuario(id_usuario),
  fecha          TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO parametro_sistema (clave, valor, descripcion, grupo, tipo, valor_min, valor_max, opciones, orden) VALUES
 ('CLAVE_LONGITUD_MIN',       '8',        'Longitud mínima de la clave',                                   'SEGURIDAD',   'ENTERO',   6, 32,   NULL, 1),
 ('CLAVE_COMPLEJA',           'SI',       'Exigir mayúscula, minúscula y número',                          'SEGURIDAD',   'BOOLEANO', NULL, NULL, NULL, 2),
 ('CLAVE_VIGENCIA_DIAS',      '0',        'Días de vigencia de la clave (0 = no vence)',                   'SEGURIDAD',   'ENTERO',   0, 365,  NULL, 3),
 ('INTENTOS_FALLIDOS_MAX',    '5',        'Intentos fallidos antes de bloquear la cuenta',                 'SEGURIDAD',   'ENTERO',   3, 10,   NULL, 4),
 ('BLOQUEO_MINUTOS',          '15',       'Minutos de bloqueo al exceder los intentos',                    'SEGURIDAD',   'ENTERO',   1, 1440, NULL, 5),
 ('SESION_INACTIVIDAD_MIN',   '30',       'Minutos de inactividad para cerrar la sesión',                  'SEGURIDAD',   'ENTERO',   5, 480,  NULL, 6),
 ('MIN_OFERTAS_DEFECTO',      '3',        'Mínimo de ofertas por proceso de cotización',                   'COMPRAS',     'ENTERO',   1, 10,   NULL, 1),
 ('DIAS_DUPLICIDAD_SOLICITUD','30',       'Días para advertir solicitudes repetidas del mismo ítem',       'COMPRAS',     'ENTERO',   0, 365,  NULL, 2),
 ('APROBACION_OC',            'NO',       'La orden de compra requiere aprobación antes de enviarse',      'COMPRAS',     'BOOLEANO', NULL, NULL, NULL, 3),
 ('DIAS_HABILES_PAGO',        '8',        'Días hábiles para pagar desde que se recibe la factura',        'PAGOS',       'ENTERO',   1, 60,   NULL, 1),
 ('CONTROL_RECEPCION_PAGO',   'ADVERTIR', 'Pagar sin recepción registrada',                                'PAGOS',       'LISTA',    NULL, NULL, 'NO,ADVERTIR,BLOQUEAR', 2),
 ('RECORDATORIO_PAGO_1',      '3',        'Primer recordatorio de pago, en días hábiles restantes',        'PAGOS',       'ENTERO',   1, 30,   NULL, 3),
 ('RECORDATORIO_PAGO_2',      '1',        'Segundo recordatorio de pago, en días hábiles restantes',       'PAGOS',       'ENTERO',   1, 30,   NULL, 4),
 ('TOLERANCIA_FACTURA',       '0',        'Diferencia permitida entre lo facturado y lo recibido (Q)',     'PAGOS',       'DECIMAL',  0, 1000, NULL, 5),
 ('HORAS_CONEXION_PROVEEDOR', '48',       'Horas sin acceso para mostrar "Sin Conexión"',                  'PROVEEDORES', 'ENTERO',   1, 720,  NULL, 1),
 ('STOCK_CRITICO_PORCENTAJE', '50',       'Porcentaje del mínimo bajo el cual el stock es Crítico',        'BODEGA',      'ENTERO',   1, 100,  NULL, 1),
 ('ARCHIVO_MAX_MB',           '5',        'Tamaño máximo de archivos adjuntos (MB)',                       'SISTEMA',     'ENTERO',   1, 20,   NULL, 1),
 ('REFRESCO_SEGUNDOS',        '60',       'Segundos entre actualizaciones de indicadores y notificaciones','SISTEMA',     'ENTERO',   15, 600, NULL, 2),
 ('IDIOMA_DEFECTO',           'es-GT',    'Idioma por defecto',                                            'SISTEMA',     'LISTA',    NULL, NULL, 'es-GT', 3),
 ('ZONA_HORARIA_DEFECTO',     'America/Guatemala', 'Zona horaria por defecto',                             'SISTEMA',     'LISTA',    NULL, NULL, 'America/Guatemala', 4)
ON CONFLICT (clave) DO UPDATE SET
  descripcion = EXCLUDED.descripcion, grupo = EXCLUDED.grupo, tipo = EXCLUDED.tipo,
  valor_min = EXCLUDED.valor_min, valor_max = EXCLUDED.valor_max,
  opciones = EXCLUDED.opciones, orden = EXCLUDED.orden;

-- 6) Días inhábiles (tabla nueva)
CREATE TABLE IF NOT EXISTS dia_inhabil (
  id_dia_inhabil BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha          DATE NOT NULL UNIQUE,
  descripcion    VARCHAR(100),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7) Sesiones abiertas (cierre remoto y por inactividad)
CREATE TABLE IF NOT EXISTS sesion_usuario (
  id_sesion     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario    INT NOT NULL REFERENCES usuario(id_usuario),
  token_hash    VARCHAR(64) NOT NULL UNIQUE,
  ip_acceso     VARCHAR(45),
  navegador     VARCHAR(200),
  fecha_inicio  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_uso    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira        TIMESTAMPTZ NOT NULL,
  revocada      BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_cierre VARCHAR(20)
);
CREATE INDEX IF NOT EXISTS idx_sesion_activa ON sesion_usuario (id_usuario) WHERE NOT revocada;

-- 8) Bitácora: intentos sin usuario, resultado e inmutabilidad
ALTER TABLE bitacora_acceso ALTER COLUMN id_usuario DROP NOT NULL;
ALTER TABLE bitacora_acceso
  ADD COLUMN IF NOT EXISTS resultado VARCHAR(10) NOT NULL DEFAULT 'EXITO'
         CHECK (resultado IN ('EXITO','DENEGADO','ERROR')),
  ADD COLUMN IF NOT EXISTS nombre_usuario_intento VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha  ON bitacora_acceso (fecha_acceso DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_modulo ON bitacora_acceso (modulo, fecha_acceso DESC);

CREATE OR REPLACE FUNCTION fn_bitacora_inmutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'La bitácora no admite UPDATE ni DELETE';
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bitacora_inmutable ON bitacora_acceso;
CREATE TRIGGER trg_bitacora_inmutable BEFORE UPDATE OR DELETE ON bitacora_acceso
  FOR EACH ROW EXECUTE FUNCTION fn_bitacora_inmutable();

CREATE OR REPLACE VIEW v_bitacora AS
SELECT b.id_bitacora, b.fecha_acceso AS fecha, b.accion, b.modulo, b.entidad, b.id_entidad,
       b.estado_anterior, b.estado_nuevo, b.resultado, b.ip_acceso, b.detalle, b.id_usuario,
       COALESCE(e.nombre || ' ' || e.apellido, u.nombre_usuario,
                b.nombre_usuario_intento, 'Usuario desconocido') AS usuario
FROM bitacora_acceso b
LEFT JOIN usuario u  ON u.id_usuario  = b.id_usuario
LEFT JOIN empleado e ON e.id_empleado = u.id_empleado;

-- 9) Permisos con acciones
ALTER TABLE permiso
  ADD COLUMN IF NOT EXISTS puede_ver      BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS puede_crear    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS puede_editar   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS puede_aprobar  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS puede_exportar BOOLEAN NOT NULL DEFAULT FALSE;

-- 10) Submenús de las pestañas administrativas
INSERT INTO submenu (id_menu, nombre, controlador, vista, icono)
SELECT m.id_menu, s.nombre, s.controlador, s.vista, s.icono
FROM menu m,
     (VALUES ('Seguridad y Accesos',          'configuracion/seguridad',    'SeguridadAccesosTab',   'shield'),
             ('Institucional',                'configuracion/institucional','InstitucionalTab',      'building'),
             ('Período Fiscal y Presupuesto', 'configuracion/periodo',     'PeriodoFiscalTab',      'calendar'),
             ('Catálogos y Parámetros',       'configuracion/catalogos',    'CatalogosParametrosTab','sliders'),
             ('Auditoría',                    'configuracion/auditoria',    'AuditoriaTab',          'clipboard'))
       AS s(nombre, controlador, vista, icono)
WHERE m.nombre = 'Configuración'
ON CONFLICT (id_menu, nombre) DO NOTHING;
