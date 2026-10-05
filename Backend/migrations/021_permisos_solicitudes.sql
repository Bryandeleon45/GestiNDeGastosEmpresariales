-- 021_permisos_solicitudes.sql  (PostgreSQL 15+)
-- Concede el permiso del submenú "Solicitudes" (controlador = 'solicitudes')
-- a todos los roles internos de la municipalidad que aún no lo tienen.
-- Los roles de proveedor (Proveedor, Proveedor Estándar, Proveedor Premium,
-- Distribuidor Mayorista) se excluyen: no gestionan solicitudes internas.

INSERT INTO permiso (id_rol, id_submenu, activo)
SELECT r.id_rol, s.id_submenu, TRUE
FROM rol r
CROSS JOIN submenu s
WHERE s.controlador = 'solicitudes'
  AND r.nombre_rol NOT ILIKE '%proveedor%'
  AND r.nombre_rol NOT ILIKE '%distribuidor%'
ON CONFLICT (id_rol, id_submenu) DO NOTHING;
