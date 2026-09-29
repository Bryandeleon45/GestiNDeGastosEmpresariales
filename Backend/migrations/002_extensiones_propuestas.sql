-- 002_extensiones_propuestas.sql  (PostgreSQL 15+)
-- Extensiones del ER propuestas en la sección 3.4 del plan.
-- Se aplican tras 001_modulo_usuarios.sql.

ALTER TABLE usuario
  ADD COLUMN intentos_fallidos     INT NOT NULL DEFAULT 0,
  ADD COLUMN bloqueado_hasta       TIMESTAMP,
  ADD COLUMN fecha_ultimo_acceso   TIMESTAMP,
  ADD COLUMN debe_cambiar_clave    BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE rol ADD COLUMN nombre_rol VARCHAR(50) UNIQUE;

ALTER TABLE bitacora_acceso
  ADD COLUMN modulo  VARCHAR(50),
  ADD COLUMN detalle TEXT;

CREATE TABLE token_reset (
  id_token   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario),
  token_hash VARCHAR(255) NOT NULL,
  expira     TIMESTAMP NOT NULL,
  usado      BOOLEAN NOT NULL DEFAULT FALSE
);
