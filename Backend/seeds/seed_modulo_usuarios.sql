-- seed_modulo_usuarios.sql  (PostgreSQL 15+)
-- Datos semilla del módulo de Gestión de Usuarios y Accesos.
-- Ejecutar tras 001 y 002.
-- Clave del administrador inicial: Admin1234 (debe cambiarla en el primer ingreso).

-- ── Dependencias ─────────────────────────────────────────────────────────────
INSERT INTO dependencia_municipal (nombre_dependencia, ubicacion, activo) VALUES
  ('DMP',     'Edificio Municipal, 1er nivel',  TRUE),
  ('DAFIM',   'Edificio Municipal, 2do nivel',  TRUE),
  ('DMM',     'Edificio Municipal, 3er nivel',  TRUE),
  ('OMSAN',   'Centro de Salud Municipal',      TRUE),
  ('DIGAM',   'Edificio Municipal, 1er nivel',  TRUE),
  ('Secretaría', 'Edificio Municipal, PB',      TRUE),
  ('Despacho',   'Edificio Municipal, 2do nivel', TRUE),
  ('Compras y Almacén', 'Bodega Central',       TRUE)
ON CONFLICT (nombre_dependencia) DO NOTHING;

-- ── Puestos ──────────────────────────────────────────────────────────────────
INSERT INTO puesto (descripcion, salario_base, activo) VALUES
  ('Director Municipal',         15000.00, TRUE),
  ('Encargado de Almacén',        8000.00, TRUE),
  ('Encargado de Compras',        8500.00, TRUE),
  ('Asistente Administrativo',    5500.00, TRUE),
  ('Contador DAFIM',              9000.00, TRUE),
  ('Alcalde Municipal',          18000.00, TRUE),
  ('Jefe de Dependencia',         7500.00, TRUE),
  ('Soporte Técnico',             7000.00, TRUE)
ON CONFLICT (descripcion) DO NOTHING;

-- ── Roles (grupos de usuarios propuestos del DERCAS) ─────────────────────────
INSERT INTO rol (descripcion, nombre_rol, activo) VALUES
  ('Administrador General',              'Administrador General',             TRUE),
  ('Encargado de Almacén y Suministros', 'Encargado de Almacén',              TRUE),
  ('Encargado de Compras / Asistente',   'Encargado de Compras',              TRUE),
  ('DAFIM',                              'DAFIM',                             TRUE),
  ('Alcalde Municipal',                  'Alcalde Municipal',                 TRUE),
  ('Dependencia Solicitante',            'Dependencia Solicitante',           TRUE),
  ('Soporte Técnico',                    'Soporte Técnico',                   TRUE)
ON CONFLICT (descripcion) DO NOTHING;

-- ── Menús (menú lateral del prototipo) ───────────────────────────────────────
INSERT INTO menu (nombre, icono, activo) VALUES
  ('Dashboard',      'dashboard',      TRUE),
  ('Dependencias',   'dependencias',   TRUE),
  ('Proveedores',    'proveedores',    TRUE),
  ('Proformas',      'proformas',      TRUE),
  ('Facturación',    'facturacion',    TRUE),
  ('Bodega',         'bodega',         TRUE),
  ('Reportes',       'reportes',       TRUE),
  ('Usuarios',       'usuarios',       TRUE),
  ('Configuración',  'configuracion',  TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- ── Submenús ─────────────────────────────────────────────────────────────────
INSERT INTO submenu (id_menu, nombre, controlador, vista, icono, activo) VALUES
  ((SELECT id_menu FROM menu WHERE nombre = 'Dashboard'),     'Panel de Control', 'dashboard',     'index', 'dashboard',     TRUE),
  ((SELECT id_menu FROM menu WHERE nombre = 'Dependencias'),  'Solicitudes',      'solicitudes',   'index', 'dependencias',  TRUE),
  ((SELECT id_menu FROM menu WHERE nombre = 'Proveedores'),   'Proveedores',      'proveedores',   'index', 'proveedores',   TRUE),
  ((SELECT id_menu FROM menu WHERE nombre = 'Proformas'),     'Proformas',        'proformas',     'index', 'proformas',     TRUE),
  ((SELECT id_menu FROM menu WHERE nombre = 'Facturación'),   'Facturación',      'facturacion',   'index', 'facturacion',   TRUE),
  ((SELECT id_menu FROM menu WHERE nombre = 'Bodega'),        'Bodega',           'bodega',        'index', 'bodega',        TRUE),
  ((SELECT id_menu FROM menu WHERE nombre = 'Reportes'),      'Reportes',         'reportes',      'index', 'reportes',      TRUE),
  ((SELECT id_menu FROM menu WHERE nombre = 'Usuarios'),      'Usuarios',         'usuarios',      'index', 'usuarios',      TRUE),
  ((SELECT id_menu FROM menu WHERE nombre = 'Configuración'), 'Configuración',    'configuracion', 'index', 'configuracion', TRUE),
  ((SELECT id_menu FROM menu WHERE nombre = 'Configuración'), 'Roles',            'roles',         'index', 'shield',        TRUE),
  ((SELECT id_menu FROM menu WHERE nombre = 'Configuración'), 'Auditoría',        'auditoria',     'index', 'activity',      TRUE)
ON CONFLICT (id_menu, nombre) DO NOTHING;

-- ── Permisos: Administrador General → todos los submenús ─────────────────────
INSERT INTO permiso (id_rol, id_submenu, activo)
SELECT (SELECT id_rol FROM rol WHERE descripcion = 'Administrador General'),
       id_submenu,
       TRUE
FROM submenu
ON CONFLICT (id_rol, id_submenu) DO NOTHING;

-- Permisos de demostración: Dependencia Solicitante ve Dependencias, Proveedores y Reportes.
INSERT INTO permiso (id_rol, id_submenu, activo) VALUES
  ((SELECT id_rol FROM rol WHERE descripcion = 'Dependencia Solicitante'),
   (SELECT id_submenu FROM submenu WHERE controlador = 'solicitudes'), TRUE),
  ((SELECT id_rol FROM rol WHERE descripcion = 'Dependencia Solicitante'),
   (SELECT id_submenu FROM submenu WHERE controlador = 'proveedores'), TRUE),
  ((SELECT id_rol FROM rol WHERE descripcion = 'Dependencia Solicitante'),
   (SELECT id_submenu FROM submenu WHERE controlador = 'reportes'),   TRUE)
ON CONFLICT (id_rol, id_submenu) DO NOTHING;

-- ── Empleados (los seis usuarios del prototipo + admin) ──────────────────────
INSERT INTO empleado (id_dependencia, id_puesto, dpi, nombre, apellido, telefono, correo, activo, fecha_ingreso) VALUES
  ((SELECT id_dependencia FROM dependencia_municipal WHERE nombre_dependencia = 'Despacho'),
   (SELECT id_puesto FROM puesto WHERE descripcion = 'Director Municipal'),
   '2891456302101', 'Carlos Enrique',    'Pérez López',    '55510201', 'carlos.perez@munipanajachel.gob.gt',    TRUE,  '2018-03-12'),
  ((SELECT id_dependencia FROM dependencia_municipal WHERE nombre_dependencia = 'DAFIM'),
   (SELECT id_puesto FROM puesto WHERE descripcion = 'Contador DAFIM'),
   '3012589740301', 'Ana Lucía',         'Ramírez García', '55510302', 'ana.ramirez@munipanajachel.gob.gt',     TRUE,  '2019-06-07'),
  ((SELECT id_dependencia FROM dependencia_municipal WHERE nombre_dependencia = 'Compras y Almacén'),
   (SELECT id_puesto FROM puesto WHERE descripcion = 'Encargado de Compras'),
   '2741236501801', 'Jorge Alberto',     'Morales Soto',   '55510403', 'jorge.morales@munipanajachel.gob.gt',   TRUE,  '2020-01-15'),
  ((SELECT id_dependencia FROM dependencia_municipal WHERE nombre_dependencia = 'DMM'),
   (SELECT id_puesto FROM puesto WHERE descripcion = 'Jefe de Dependencia'),
   '3145678920501', 'María del Carmen',  'Ajú Batz',       '55510504', 'maria.aju@munipanajachel.gob.gt',       TRUE,  '2021-08-20'),
  ((SELECT id_dependencia FROM dependencia_municipal WHERE nombre_dependencia = 'OMSAN'),
   (SELECT id_puesto FROM puesto WHERE descripcion = 'Jefe de Dependencia'),
   '2989741236001', 'Roberto Josué',     'Cojolón Tzul',   '55510605', 'roberto.cojolon@munipanajachel.gob.gt', FALSE, '2017-11-03'),
  ((SELECT id_dependencia FROM dependencia_municipal WHERE nombre_dependencia = 'Secretaría'),
   (SELECT id_puesto FROM puesto WHERE descripcion = 'Asistente Administrativo'),
   '3056123478901', 'Silvia Esperanza',  'Cholotío Giron', '55510706', 'silvia.cholotio@munipanajachel.gob.gt', TRUE,  '2022-04-18'),
  ((SELECT id_dependencia FROM dependencia_municipal WHERE nombre_dependencia = 'DIGAM'),
   (SELECT id_puesto FROM puesto WHERE descripcion = 'Jefe de Dependencia'),
   '2812345690201', 'Luis Fernando',     'Tzep Chumil',    '55510807', 'luis.tzep@munipanajachel.gob.gt',       TRUE,  '2020-09-09'),
  ((SELECT id_dependencia FROM dependencia_municipal WHERE nombre_dependencia = 'DMP'),
   (SELECT id_puesto FROM puesto WHERE descripcion = 'Asistente Administrativo'),
   '3201478965401', 'Diana Patricia',    'Ajanel Quiej',   '55510908', 'diana.ajanel@munipanajachel.gob.gt',    FALSE, '2016-02-25'),
  ((SELECT id_dependencia FROM dependencia_municipal WHERE nombre_dependencia = 'Despacho'),
   (SELECT id_puesto FROM puesto WHERE descripcion = 'Alcalde Municipal'),
   '2771112223301', 'Ricardo',           'Gómez',          '55510000', 'ricardo.gomez@munipanajachel.gob.gt',   TRUE,  '2015-01-05')
ON CONFLICT (dpi) DO NOTHING;

-- ── Usuarios (cuentas de acceso) ──────────────────────────────────────────────
-- Clave inicial para todos: Admin1234 (debe_cambiar_clave = TRUE).
INSERT INTO usuario (id_empleado, id_rol, nombre_usuario, clave, correo, activo, debe_cambiar_clave)
SELECT e.id_empleado, r.id_rol, u.nombre_usuario, h.clave, u.correo, TRUE, TRUE
FROM (VALUES
  ('2891456302101', 'Dependencia Solicitante',           'carlos.perez', 'carlos.perez@munipanajachel.gob.gt'),
  ('3012589740301', 'DAFIM',                             'ana.ramirez',  'ana.ramirez@munipanajachel.gob.gt'),
  ('3145678920501', 'Encargado de Almacén y Suministros','maria.aju',    'maria.aju@munipanajachel.gob.gt'),
  ('2812345690201', 'Encargado de Compras / Asistente',  'luis.tzep',    'luis.tzep@munipanajachel.gob.gt'),
  ('2771112223301', 'Administrador General',             'admin',        'admin@munipanajachel.gob.gt')
) AS u(dpi, rol, nombre_usuario, correo)
JOIN empleado e ON e.dpi = u.dpi
JOIN rol r ON r.descripcion = u.rol
CROSS JOIN LATERAL (VALUES ('$2a$10$HfERyFCJPnNX4LgZtAvKW.gBNcV17ChfLDwYM.rDHztsGfZ4Xl4V.')) AS h(clave)
ON CONFLICT (nombre_usuario) DO NOTHING;
