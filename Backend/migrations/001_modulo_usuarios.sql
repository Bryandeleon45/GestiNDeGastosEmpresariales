-- 001_modulo_usuarios.sql  (PostgreSQL 15+)
-- Módulo de Gestión de Usuarios y Accesos — Municipalidad de Panajachel
-- Esquema del ER (figura 10 de la tesis / DERCAS), mapeado a snake_case.

CREATE TABLE dependencia_municipal (
  id_dependencia     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_dependencia VARCHAR(100) NOT NULL UNIQUE,
  ubicacion          VARCHAR(150),
  activo             BOOLEAN   NOT NULL DEFAULT TRUE,
  fecha_registro     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE puesto (
  id_puesto    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  descripcion  VARCHAR(100) NOT NULL UNIQUE,
  salario_base NUMERIC(10,2),
  activo       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE empleado (
  id_empleado    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_dependencia INT NOT NULL REFERENCES dependencia_municipal(id_dependencia),
  id_puesto      INT NOT NULL REFERENCES puesto(id_puesto),
  dpi            VARCHAR(13) NOT NULL UNIQUE,
  nombre         VARCHAR(100) NOT NULL,
  apellido       VARCHAR(100) NOT NULL,
  telefono       VARCHAR(8),
  direccion      VARCHAR(255),
  correo         VARCHAR(100) NOT NULL UNIQUE,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_ingreso  DATE
);

CREATE TABLE rol (
  id_rol         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  descripcion    VARCHAR(100) NOT NULL UNIQUE,
  activo         BOOLEAN   NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE menu (
  id_menu        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre         VARCHAR(50) NOT NULL UNIQUE,
  icono          VARCHAR(50),
  activo         BOOLEAN   NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE submenu (
  id_submenu     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_menu        INT NOT NULL REFERENCES menu(id_menu),
  nombre         VARCHAR(50)  NOT NULL,
  controlador    VARCHAR(100) NOT NULL,
  vista          VARCHAR(100) NOT NULL,
  icono          VARCHAR(50),
  activo         BOOLEAN   NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (id_menu, nombre)
);

CREATE TABLE permiso (
  id_permiso     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_rol         INT NOT NULL REFERENCES rol(id_rol),
  id_submenu     INT NOT NULL REFERENCES submenu(id_submenu),
  activo         BOOLEAN   NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (id_rol, id_submenu)
);

CREATE TABLE usuario (
  id_usuario     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_empleado    INT NOT NULL UNIQUE REFERENCES empleado(id_empleado),
  id_rol         INT NOT NULL REFERENCES rol(id_rol),
  nombre_usuario VARCHAR(50)  NOT NULL UNIQUE,
  clave          VARCHAR(255) NOT NULL,          -- SIEMPRE hash bcrypt, nunca texto plano
  correo         VARCHAR(100) NOT NULL UNIQUE,
  activo         BOOLEAN   NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE bitacora_acceso (
  id_bitacora  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario   INT NOT NULL REFERENCES usuario(id_usuario),
  accion       VARCHAR(100) NOT NULL,
  ip_acceso    VARCHAR(45),
  fecha_acceso TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_bitacora_usuario_fecha ON bitacora_acceso (id_usuario, fecha_acceso DESC);
CREATE INDEX idx_permiso_rol            ON permiso (id_rol);
CREATE INDEX idx_empleado_dependencia   ON empleado (id_dependencia);
