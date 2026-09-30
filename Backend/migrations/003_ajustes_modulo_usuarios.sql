-- 003_ajustes_modulo_usuarios.sql  (PostgreSQL 15+)
-- Ajustes para alinear el esquema con el frontend (módulo de usuarios):
--  1) fecha_nacimiento: capturada en el formulario "Registrar Usuario" pero sin columna en el ER.
--  2) telefono: el frontend usa formato con guion (ej. 5551-0000); VARCHAR(8) era insuficiente.

ALTER TABLE empleado ADD COLUMN fecha_nacimiento DATE;

ALTER TABLE empleado ALTER COLUMN telefono TYPE VARCHAR(20);
