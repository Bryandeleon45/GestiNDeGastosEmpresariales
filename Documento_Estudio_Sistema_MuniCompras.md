# Documento de Estudio del Sistema — MuniCompras

**Sistema de Gestión de Compras y Cadena de Proveedores**
**Municipalidad de Panajachel — Guatemala**

| Dato | Detalle |
|---|---|
| Nombre del sistema | MuniCompras |
| Institución | Municipalidad de Panajachel |
| Tipo | Sistema web de gestión administrativa |
| Moneda | Quetzal guatemalteco (Q) |
| Idioma / locale | Español (es-GT), fechas `d/m/aaaa` |
| Backend | Node.js + Express (puerto 4000) |
| Base de datos | PostgreSQL, base `GestionCadenadeProveedores` |
| Frontend | React 19 + Vite 8 + Tailwind CSS v4 + Recharts |
| Autenticación | JWT + control de acceso por roles y permisos |
| Despliegue | Docker Compose local / Render (backend + frontend estático + PostgreSQL/Neon) |
| Tablas de base de datos | **46 tablas** + **5 vistas** + **2 triggers de inmutabilidad** |
| Endpoints REST | **185 endpoints** distribuidos en 19 archivos de rutas |
| Documento | Estudio técnico-funcional del sistema |

> **Nota de alcance:** el conteo de tablas se obtuvo del esquema generado por las migraciones `001` a `081` y verificado contra el respaldo `docker/local-db/local.sql`. El sistema no fue modificado; este documento es solo de estudio.

---

## 1. Resumen ejecutivo

**MuniCompras** es un sistema web institucional que digitaliza el ciclo completo de compras de la Municipalidad de Panajachel, desde que una dependencia solicita insumos hasta que se paga la factura al proveedor y se descarga el inventario de bodega.

El sistema cubre diez grandes procesos:

1. **Seguridad y usuarios**: empleados, usuarios, roles, menús, permisos, sesiones y auditoría.
2. **Solicitudes de compra**: requisiciones por dependencia con detalle de insumos, documentos PDF, prioridad y presupuesto.
3. **Proveedores**: registro, tipos, conexión al portal y gestión de acceso.
4. **Proformas y cotizaciones**: publicación de procesos, invitación a proveedores, recepción y comparación de ofertas, adjudicación.
5. **Órdenes de compra**: emisión, aprobación, envío y control de estado.
6. **Bodega e inventario**: recepciones, control de cantidades, vales de salida, kardex inmutable y alertas de stock.
7. **Facturación**: registro de facturas (manual o desde el portal), revisión, vencimientos y NPG.
8. **Órdenes de pago**: programación, pago, pago con atraso y anulación.
9. **Reportes y dashboard**: 8 reportes formales, indicadores, gráficos y exportación CSV.
10. **Configuración institucional**: identidad, parámetros del sistema, períodos fiscales, presupuestos, catálogos y días inhábiles.

La arquitectura es de **tres capas**: frontend SPA (React), API REST (Express) y base de datos relacional (PostgreSQL). Toda la lógica de negocio y las validaciones críticas viven en el backend; la base de datos refuerza la integridad mediante llaves foráneas, restricciones `CHECK`, vistas y triggers.

---

## 2. Introducción

### 2.1 Problema que resuelve

Antes de la digitalización, el proceso de compras municipal se apoyaba en formularios físicos, hojas de cálculo y comunicaciones dispersas. Eso generaba:

- Pérdida de trazabilidad entre solicitud, cotización, orden, recepción, factura y pago.
- Dificultad para controlar el presupuesto por dependencia.
- Errores en existencias de bodega y falta de un kardex confiable.
- Poca transparencia en la invitación y selección de proveedores.
- Imposibilidad de auditar quién hizo qué y cuándo.

MuniCompras centraliza todo el expediente en una sola base de datos y ofrece un portal externo para que los proveedores consulten oportunidades, coticen, suban documentos y registren facturas.

### 2.2 Objetivos del sistema

| Tipo | Objetivo |
|---|---|
| General | Gestionar integralmente la cadena de suministros y compras de la Municipalidad de Panajachel. |
| Específico | Controlar el presupuesto asignado, comprometido y pagado por dependencia y período fiscal. |
| Específico | Trazar cada compra desde la requisición hasta el pago, con historial auditable. |
| Específico | Mantener inventario y kardex exactos por bodega e insumo. |
| Específico | Dar transparencia a los proveedores mediante un portal de oportunidades y cotizaciones. |
| Específico | Aplicar seguridad basada en roles, permisos y sesiones revocables. |

### 2.3 Alcance

El sistema es **multi-rol** y contempla dos grandes experiencias:

- **Portal interno** (funcionarios municipales): dashboard, solicitudes, proveedores, proformas, facturación, bodega, reportes, usuarios, configuración y auditoría.
- **Portal de proveedores** (usuarios externos): mis oportunidades y cotizaciones, órdenes y facturas, entregas en bodega y configuración de perfil.

---

## 3. Arquitectura del sistema

### 3.1 Arquitectura de tres capas

```
┌──────────────────────────────────────────────────────────────┐
│                        NAVEGADOR (SPA)                        │
│  React 19 + Vite 8 + Tailwind v4 + Recharts + PDF/Excel        │
│  - Pantallas internas (admin)                                  │
│  - Portal de proveedores                                       │
└───────────────────────────────┬──────────────────────────────┘
                                │ HTTPS / JSON
                                │ Authorization: Bearer <JWT>
┌───────────────────────────────▼──────────────────────────────┐
│                     API REST — Node.js + Express              │
│  Helmet · CORS · Rate limit · JWT · RBAC                       │
│  19 routers · 185 endpoints · servicios de negocio            │
│  Mailer · WhatsApp · Notificaciones · Alertas · Bitácora       │
└───────────────────────────────┬──────────────────────────────┘
                                │ SQL (pool pg)
┌───────────────────────────────▼──────────────────────────────┐
│                  PostgreSQL — GestionCadenadeProveedores       │
│  46 tablas · 5 vistas · 2 triggers · índices · FKs · CHECK     │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Capas y responsabilidades

| Capa | Responsabilidad | Tecnología |
|---|---|---|
| Presentación | UI, navegación, formularios, PDFs y Excel en cliente | React 19, TypeScript, Vite, Tailwind v4, Recharts, exceljs, pdf-lib |
| Lógica / API | Validaciones, reglas de negocio, permisos, transacciones, notificaciones | Node.js 22, Express 4, JWT, bcryptjs, pg, nodemailer, pdfkit |
| Datos | Persistencia, integridad, historial y consultas agregadas | PostgreSQL 15+, vistas, triggers, llaves foráneas y CHECK |
| Infraestructura | Contenedores y despliegue | Docker Compose, Render, Neon/PostgreSQL |

### 3.3 Flujo de una petición

1. El usuario inicia sesión en `POST /api/auth/login`.
2. El backend valida usuario, clave (bcrypt) y bloqueo; registra bitácora y sesión.
3. Devuelve un JWT firmado y el menú permitido según su rol.
4. El frontend guarda el token y lo envía en cada petición (`Authorization: Bearer …`).
5. El middleware `authenticate` verifica el token, que la sesión no esté revocada, que el usuario esté activo y no bloqueado.
6. El middleware `authorize(controlador)` valida que el rol tenga permiso activo sobre el submenú solicitado.
7. El router ejecuta la consulta SQL y responde JSON.
8. Las acciones relevantes se registran en `bitacora_acceso`.

---

## 4. Stack tecnológico

### 4.1 Backend

| Componente | Versión / uso |
|---|---|
| Node.js | 22.x (definido en `package.json` y Docker) |
| Express | ^4.19.2 — servidor HTTP y routers |
| pg | ^8.12.0 — pool de conexiones PostgreSQL |
| jsonwebtoken | ^9.0.2 — firma y verificación JWT |
| bcryptjs | ^2.4.3 — hash de contraseñas (costo 12) |
| helmet | ^8.3.0 — cabeceras de seguridad HTTP |
| cors | ^2.8.5 — control de orígenes permitidos |
| express-rate-limit | ^8.7.1 — límite de peticiones |
| nodemailer | ^10.2.1 — correo SMTP |
| pdfkit | ^0.15.0 — generación de documentos PDF |
| dotenv | ^16.4.5 — variables de entorno |

### 4.2 Frontend

| Componente | Versión / uso |
|---|---|
| React / React DOM | ^19.0.0 |
| Vite | ^8.0.0 — build y servidor de desarrollo |
| TypeScript | ^5.7.0 |
| Tailwind CSS | ^4.0.0 (sin `tailwind.config`; variables en `src/index.css`) |
| Recharts | ^3.10.1 — gráficos del dashboard y reportes |
| exceljs | ^4.4.0 — exportación a Excel |
| pdf-lib | ^1.17.1 — generación/edición de PDF en cliente |
| oxfmt | ^0.2.0 — formateo de código |

### 4.3 Base de datos e infraestructura

| Componente | Uso |
|---|---|
| PostgreSQL 15+ (Docker usa 18-alpine) | Base relacional `GestionCadenadeProveedores` |
| Docker Compose | Servicios `db`, `backend`, `frontend` |
| Render | API Node + sitio estático + PostgreSQL/Neon |
| Neon (opcional) | PostgreSQL remoto mediante `DATABASE_URL` con SSL |

---

## 5. Base de datos (sección principal)

### 5.1 Conteo oficial

| Objeto | Cantidad |
|---|---|
| **Tablas** | **46** |
| Vistas | 5 (`v_bitacora`, `v_recibido_oc`, `v_expediente`, `v_factura_estado`, `v_presupuesto_dependencia`) |
| Triggers | 2 (`trg_kardex_inmutable`, `trg_bitacora_inmutable`) |
| Funciones de trigger | 2 (`kardex_inmutable()`, `fn_bitacora_inmutable()`) |
| Secuencias | Una por cada llave primaria serial/identity |
| Esquema | `public` |

**Respuesta directa: el sistema tiene 46 tablas.**

### 5.2 Distribución de las 46 tablas por dominio

| # | Dominio | Tablas | Total |
|---|---|---|---|
| 1 | Seguridad, usuarios y accesos | `dependencia_municipal`, `puesto`, `empleado`, `rol`, `menu`, `submenu`, `permiso`, `usuario`, `bitacora_acceso`, `token_reset`, `sesion_usuario`, `usuario_preferencia` | 12 |
| 2 | Proveedores | `tipo_proveedor`, `proveedor`, `proveedor_usuario` | 3 |
| 3 | Catálogos e inventario base | `categoria`, `unidad_medida`, `insumo`, `bodega`, `insumo_bodega` | 5 |
| 4 | Presupuesto y períodos | `periodo_fiscal`, `presupuesto_dependencia`, `partida_presupuestaria`, `fuente_financiamiento` | 4 |
| 5 | Solicitudes y cotizaciones | `requisicion`, `detalle_requisicion`, `requisicion_imagen`, `proceso_cotizacion`, `invitacion_proveedor`, `cotizacion`, `detalle_cotizacion`, `documento_cotizacion` | 8 |
| 6 | Órdenes de compra | `orden_compra`, `detalle_orden_compra` | 2 |
| 7 | Facturación y pagos | `factura`, `orden_pago` | 2 |
| 8 | Bodega y kardex | `recepcion_bodega`, `detalle_recepcion_bodega`, `vale_salida`, `detalle_vale_salida`, `kardex` | 5 |
| 9 | Configuración y notificaciones | `identidad_institucional`, `parametro_sistema`, `parametro_historial`, `dia_inhabil`, `notificacion` | 5 |
| | **Total** | | **46** |

### 5.3 Diccionario de tablas

#### 5.3.1 Seguridad, usuarios y accesos (12)

| Tabla | Propósito | Llave primaria | Campos y relaciones clave |
|---|---|---|---|
| `dependencia_municipal` | Dependencias/áreas de la municipalidad | `id_dependencia` | `nombre_dependencia`, `siglas`, `id_empleado_responsable → empleado` |
| `puesto` | Puestos de trabajo y salario base | `id_puesto` | `descripcion`, `salario_base`, `activo` |
| `empleado` | Datos personales y laborales | `id_empleado` | `dpi` único, `id_dependencia → dependencia_municipal`, `id_puesto → puesto`, `correo`, `fecha_nacimiento`, `extension` |
| `rol` | Roles del sistema | `id_rol` | `descripcion`, `nombre_rol` único, `activo` |
| `menu` | Menús laterales | `id_menu` | `nombre`, `icono`, `activo` |
| `submenu` | Opciones dentro de cada menú | `id_submenu` | `id_menu → menu`, `controlador` (clave de permiso), `vista`, `icono` |
| `permiso` | Permisos por rol y submenú | `id_permiso` | `id_rol → rol`, `id_submenu → submenu`, `activo`, y banderas `puede_ver/crear/editar/aprobar/exportar` |
| `usuario` | Cuentas de acceso | `id_usuario` | `id_empleado → empleado`, `id_rol → rol`, `nombre_usuario` único, `clave` (bcrypt), `tipo_usuario` (`INTERNO`/`PROVEEDOR`), `intentos_fallidos`, `bloqueado_hasta`, `debe_cambiar_clave` |
| `bitacora_acceso` | Auditoría de acciones | `id_bitacora` | `id_usuario → usuario`, `accion`, `modulo`, `entidad`, `id_entidad`, `estado_anterior`, `estado_nuevo`, `resultado`, `ip_acceso`, `detalle` |
| `token_reset` | Tokens de recuperación de clave | `id_token` | `id_usuario → usuario`, `token_hash`, `expira`, `usado` |
| `sesion_usuario` | Sesiones activas/revocables | `id_sesion` | `id_usuario → usuario`, `token_hash`, `ip_acceso`, `navegador`, `expira`, `revocada`, `motivo_cierre` |
| `usuario_preferencia` | Preferencias y perfil | `id_usuario` (PK/FK) | `tema`, `color_acento`, `interfaz_compacta`, `idioma`, `zona_horaria`, `notif_correo`, `notif_sistema`, `foto`, `whatsapp` |

#### 5.3.2 Proveedores (3)

| Tabla | Propósito | Llave primaria | Campos y relaciones clave |
|---|---|---|---|
| `tipo_proveedor` | Clasificación del proveedor | `id_tipo_proveedor` | `descripcion`, `activo` |
| `proveedor` | Datos fiscales y de contacto | `id_proveedor` | `id_tipo_proveedor → tipo_proveedor`, `nit`, `razon_social`, `representante_legal`, `correo`, `telefono` (8 dígitos), `activo` |
| `proveedor_usuario` | Vínculo proveedor ↔ usuario del portal | `id_proveedor_usuario` | `id_proveedor → proveedor`, `id_usuario → usuario`, `es_principal`, `fecha_conexion` |

#### 5.3.3 Catálogos e inventario base (5)

| Tabla | Propósito | Llave primaria | Campos y relaciones clave |
|---|---|---|---|
| `categoria` | Categorías de insumos | `id_categoria` | `nombre`, `descripcion`, `activo` |
| `unidad_medida` | Unidades de medida | `id_unidad_medida` | `nombre`, `simbolo`, `activo` |
| `insumo` | Catálogo maestro de insumos | `id_insumo` | `id_categoria → categoria`, `id_unidad_medida → unidad_medida`, `codigo_insumo` único, `nombre`, `precio_referencial`, `activo` |
| `bodega` | Bodegas físicas | `id_bodega` | `nombre_bodega`, `ubicacion`, `encargado`, `activo` |
| `insumo_bodega` | Existencias por insumo y bodega | `(id_insumo, id_bodega)` | `id_insumo → insumo`, `id_bodega → bodega`, `stock_actual`, `stock_minimo` |

#### 5.3.4 Presupuesto y períodos (4)

| Tabla | Propósito | Llave primaria | Campos y relaciones clave |
|---|---|---|---|
| `periodo_fiscal` | Años fiscales | `id_periodo` | `anio` único, `activo`, `fecha_inicio`, `fecha_fin`, `cerrado`, `id_usuario_cierre → usuario`; restricción: no puede estar activo y cerrado a la vez |
| `presupuesto_dependencia` | Presupuesto asignado por dependencia y período | `id_presupuesto` | `id_dependencia → dependencia_municipal`, `id_periodo → periodo_fiscal`, `monto_asignado` |
| `partida_presupuestaria` | Partidas de gasto | `id_partida` | `codigo` único, `descripcion`, `activo` |
| `fuente_financiamiento` | Fuentes de financiamiento | `id_fuente` | `codigo` único, `descripcion`, `activo` |

#### 5.3.5 Solicitudes y cotizaciones (8)

| Tabla | Propósito | Llave primaria | Campos y relaciones clave |
|---|---|---|---|
| `requisicion` | Solicitud de compra de una dependencia | `id_requisicion` | `codigo_requisicion` único, `id_usuario → usuario`, `id_dependencia → dependencia_municipal`, `id_periodo → periodo_fiscal`, `tipo_solicitud`, `justificacion`, `prioridad`, `estado`, `monto_estimado`, `monto_adjudicado`, `adjudicada`, `id_usuario_revisor → usuario` |
| `detalle_requisicion` | Renglones solicitados | `id_detalle` | `id_requisicion → requisicion` (CASCADE), `id_insumo → insumo` (opcional), `descripcion_libre` (si no hay insumo), `id_unidad_medida → unidad_medida`, `cantidad`, `precio_estimado` |
| `requisicion_imagen` | Documentos PDF de respaldo | `id_imagen` | `id_requisicion → requisicion` (CASCADE), `nombre_archivo`, `mime_type` (solo PDF), `contenido_base64` |
| `proceso_cotizacion` | Proceso de cotización de una requisición | `id_proceso` | `id_requisicion → requisicion`, `fase`, `fecha_publicacion`, `fecha_limite`, `min_ofertas`, `motivo_adjudicacion`, `id_usuario_publica/adjudica → usuario` |
| `invitacion_proveedor` | Proveedores invitados al proceso | `id_invitacion` | `id_proceso → proceso_cotizacion` (CASCADE), `id_proveedor → proveedor`, `estado`, `motivo_declina`, `fecha_vista` |
| `cotizacion` | Oferta de un proveedor | `id_cotizacion` | `id_requisicion → requisicion`, `id_proveedor → proveedor`, `numero_cotizacion` único, `monto_total`, `estado_cotizacion`, `seleccionada`, `origen` (`PORTAL`/`MANUAL`), `plazo_credito_dias`, `id_usuario_registra → usuario` |
| `detalle_cotizacion` | Renglones de la oferta | `id_detalle_cotizacion` | `id_cotizacion → cotizacion` (CASCADE), `id_detalle_requisicion → detalle_requisicion`, `cantidad_cotizada`, `precio_unitario`, `subtotal` generado |
| `documento_cotizacion` | Archivos adjuntos de la cotización | `id_documento` | `id_cotizacion → cotizacion` (CASCADE), `nombre_archivo`, `mime_type`, `contenido_base64` |

#### 5.3.6 Órdenes de compra (2)

| Tabla | Propósito | Llave primaria | Campos y relaciones clave |
|---|---|---|---|
| `orden_compra` | Orden formal de compra | `id_orden_compra` | `numero_orden` único, `id_requisicion → requisicion`, `id_cotizacion → cotizacion` (puede ser nula en OC provisional), `id_proveedor → proveedor` (puede ser nulo), `monto_total`, `estado`, `id_usuario_emite/aprobador → usuario`, `plazo_credito_dias` |
| `detalle_orden_compra` | Renglones de la orden | `id_detalle_orden` | `id_orden_compra → orden_compra` (CASCADE), `id_detalle_requisicion → detalle_requisicion`, `cantidad_comprada`, `precio_unitario`, `subtotal` generado |

#### 5.3.7 Facturación y pagos (2)

| Tabla | Propósito | Llave primaria | Campos y relaciones clave |
|---|---|---|---|
| `factura` | Factura del proveedor | `id_factura` | `id_orden_compra → orden_compra`, `id_proveedor → proveedor`, `serie`, `numero_factura`, `numero_autorizacion`, `npg`, `fecha_emision`, `monto_total`, `plazo_credito_dias`, `fecha_vencimiento`, `estado`, `origen`, archivos PDF/XML en base64, NPG PDF, `id_usuario_registra/revisa → usuario` |
| `orden_pago` | Programación y ejecución del pago | `id_orden_pago` | `numero_orden_pago` único, `id_factura → factura`, `id_proveedor → proveedor`, `monto`, `id_partida → partida_presupuestaria`, `id_fuente → fuente_financiamiento`, `fecha_vencimiento`, `fecha_pago_programada/real`, `estado`, `pagado_atraso`, `id_usuario_crea/programa/paga → usuario` |

#### 5.3.8 Bodega y kardex (5)

| Tabla | Propósito | Llave primaria | Campos y relaciones clave |
|---|---|---|---|
| `recepcion_bodega` | Recepción de una orden en bodega | `id_recepcion` | `id_orden_compra → orden_compra`, `id_bodega → bodega`, `id_usuario → usuario`, `numero_comprobante`, `estado`, `observaciones` |
| `detalle_recepcion_bodega` | Renglones recibidos | `id_detalle_recepcion` | `id_recepcion → recepcion_bodega` (CASCADE), `id_detalle_orden → detalle_orden_compra`, `id_insumo → insumo`, `cantidad_esperada/recibida/aceptada`, `estado_item` |
| `vale_salida` | Vale de despacho a una dependencia | `id_vale_salida` | `id_dependencia → dependencia_municipal`, `id_usuario_solicitante/autoriza → usuario`, `justificacion`, `estado` |
| `detalle_vale_salida` | Renglones del vale | `id_detalle_vale` | `id_vale_salida → vale_salida` (CASCADE), `id_insumo → insumo`, `cantidad_salida` |
| `kardex` | Movimientos de inventario (inmutable) | `id_kardex` | `id_insumo → insumo`, `id_bodega → bodega`, `id_recepcion → recepcion_bodega`, `id_vale_salida → vale_salida`, `id_usuario → usuario`, `tipo_movimiento` (`Entrada`/`Salida`/`Ajuste`), `cantidad`, `stock_anterior`, `stock_actual`, `fecha_movimiento` |

#### 5.3.9 Configuración y notificaciones (5)

| Tabla | Propósito | Llave primaria | Campos y relaciones clave |
|---|---|---|---|
| `identidad_institucional` | Identidad visual y datos de la institución | `id_identidad` (siempre 1) | `nombre_institucion`, `nombre_sistema`, `lema`, `nit_institucional`, `color_principal`, `colores_acento`, `logo`, `imagen_login` |
| `parametro_sistema` | Parámetros configurables | `clave` | `valor`, `descripcion`, `grupo`, `tipo` (`ENTERO`/`DECIMAL`/`TEXTO`/`BOOLEANO`/`LISTA`), `valor_min/max`, `opciones`, `orden` |
| `parametro_historial` | Historial de cambios de parámetros | `id_historial` | `clave → parametro_sistema`, `valor_anterior`, `valor_nuevo`, `id_usuario → usuario`, `fecha` |
| `dia_inhabil` | Días no laborables | `id_dia_inhabil` | `fecha` única, `descripcion` |
| `notificacion` | Notificaciones internas | `id_notificacion` | `id_usuario → usuario`, `tipo`, `titulo`, `mensaje`, `referencia`, `leida`, `fecha` |

### 5.4 Vistas de base de datos (5)

Las vistas encapsulan cálculos que se usan en varias partes del sistema y evitan duplicar lógica:

| Vista | Función |
|---|---|
| `v_bitacora` | Une `bitacora_acceso`, `usuario` y `empleado` para mostrar el nombre legible del usuario que actuó. |
| `v_recibido_oc` | Calcula el monto realmente recibido por orden de compra. Vale el monto total de la OC solo si existe una recepción en estado `Completa`, `Parcial` o `Con Novedades` con cantidad aceptada > 0. |
| `v_expediente` | Vista integral del expediente de compra: solicitud, fase de cotización, orden, monto ordenado, recibido, facturado, pagado y una **etapa** resumida (`En cotización`, `Orden de compra`, `Entrega parcial`, `Recibida`, `Facturada`, `Pagada`, etc.). |
| `v_factura_estado` | Combina factura y orden de pago para mostrar un estado visible: `Pendiente`, `Pagado`, `Pagado con atraso`, `Rechazada`, `Vencido`. |
| `v_presupuesto_dependencia` | Calcula por dependencia y período: `monto_asignado`, `comprometido` (solicitudes `Aprobada`/`En Compra`), `pagado` (órdenes de pago `Pagada`) y `disponible = asignado − comprometido`. |

### 5.5 Integridad referencial

El esquema usa **llaves foráneas** en prácticamente todas las relaciones. Ejemplos representativos:

- `empleado.id_dependencia → dependencia_municipal`.
- `usuario.id_rol → rol` y `usuario.id_empleado → empleado`.
- `permiso(id_rol, id_submenu) → rol, submenu`.
- `insumo.id_categoria → categoria` y `insumo.id_unidad_medida → unidad_medida`.
- `requisicion.id_dependencia → dependencia_municipal` e `id_periodo → periodo_fiscal`.
- `detalle_requisicion.id_requisicion → requisicion` con `ON DELETE CASCADE`.
- `detalle_cotizacion.id_cotizacion → cotizacion` con `ON DELETE CASCADE`.
- `detalle_orden_compra.id_orden_compra → orden_compra` con `ON DELETE CASCADE`.
- `detalle_recepcion_bodega.id_recepcion → recepcion_bodega` con `ON DELETE CASCADE`.
- `detalle_vale_salida.id_vale_salida → vale_salida` con `ON DELETE CASCADE`.
- `documento_cotizacion.id_cotizacion → cotizacion` con `ON DELETE CASCADE`.
- `orden_pago.id_factura → factura`, `id_partida → partida_presupuestaria`, `id_fuente → fuente_financiamiento`.

### 5.6 Restricciones `CHECK` y reglas de integridad

La base de datos no solo guarda datos: **impone reglas**. Las más importantes son:

| Tabla | Regla |
|---|---|
| `usuario` | `tipo_usuario` solo puede ser `INTERNO` o `PROVEEDOR`; un usuario interno debe tener empleado y uno de proveedor no. |
| `empleado` | `dpi` único; correo obligatorio. |
| `proveedor` | `nit` único; teléfonos de exactamente 8 dígitos. |
| `requisicion` | Estados permitidos: `Pendiente`, `En Revisión`, `Aprobada`, `Rechazada`, `En Compra`, `Cancelada`; prioridad `Baja`, `Media`, `Alta`, `Urgente`; montos ≥ 0. |
| `detalle_requisicion` | Debe tener insumo **o** descripción libre; cantidad > 0. |
| `cotizacion` | Estados permitidos; monto ≥ 0; origen `PORTAL`/`MANUAL`; días de crédito ≥ 0. |
| `detalle_cotizacion` / `detalle_orden_compra` | Cantidades > 0; `subtotal` es columna generada (`cantidad × precio`). |
| `proceso_cotizacion` | `fecha_limite > fecha_publicacion`; fases `Publicada`, `Comparación`, `Adjudicada`, `Desierta`; mínimo 1 oferta. |
| `invitacion_proveedor` | Estado `Invitado` o `Declinó`. |
| `orden_compra` | Estados `Pendiente`, `Aprobada`, `Enviada`, `Entregada`, `Cancelada`; monto ≥ 0. |
| `recepcion_bodega` | Estados `En Proceso`, `Completa`, `Parcial`, `Con Novedades`, `Cancelada`. |
| `detalle_recepcion_bodega` | `cantidad_aceptada ≤ cantidad_recibida`; estados de ítem `Pendiente`, `Recibido`, `Rechazado`, `Faltante`. |
| `vale_salida` | Estados `Pendiente`, `Autorizado`, `Entregado`, `Cancelado`. |
| `kardex` | Tipo `Entrada`/`Salida`/`Ajuste`; cantidad > 0; stock actual ≥ 0. |
| `factura` | `fecha_vencimiento ≥ fecha_emision`; monto > 0; estados `Recibida`, `En Revisión`, `Aprobada`, `Rechazada`. |
| `orden_pago` | Monto > 0; si está `Pagada`, exige `fecha_pago_real` y `referencia_pago`. |
| `periodo_fiscal` | No puede estar `activo` y `cerrado` simultáneamente; `fecha_fin ≥ fecha_inicio`. |
| `requisicion_imagen` | Solo permite PDF (`mime_type = 'application/pdf'`). |
| `identidad_institucional` | Solo una fila (`id_identidad = 1`) y color hexadecimal válido. |
| `parametro_sistema` | Tipo `ENTERO`, `DECIMAL`, `TEXTO`, `BOOLEANO` o `LISTA`. |

### 5.7 Índices y rendimiento

El esquema define índices para las consultas más frecuentes:

- `idx_bitacora_usuario_fecha (id_usuario, fecha_acceso DESC)`.
- `idx_bitacora_fecha (fecha_acceso DESC)` e `idx_bitacora_modulo (modulo, fecha_acceso DESC)`.
- `idx_bitacora_entidad (entidad, id_entidad)`.
- `idx_permiso_rol (id_rol)`.
- `idx_empleado_dependencia (id_dependencia)`.
- `idx_proveedor_nombre (lower(razon_social))` e `idx_proveedor_tipo (id_tipo_proveedor)`.
- `idx_req_dependencia (id_dependencia, fecha_solicitud DESC)` e `idx_req_estado (estado)`.
- `idx_det_req (id_requisicion)`.
- `idx_cot_requisicion`, `idx_cot_proveedor`, `idx_oc_estado`, `idx_invitacion_prov`, `idx_notif_usuario`.
- `idx_factura_estado`, `idx_factura_vencimiento`, `idx_factura_oc`.
- `idx_op_estado_venc (estado, fecha_vencimiento)`.
- `ix_kardex_insumo_fecha (id_insumo, fecha_movimiento DESC)`.
- `idx_doc_cotizacion (id_cotizacion)` e `idx_invitacion_estado (id_proveedor, estado)`.
- `idx_sesion_activa (id_usuario) WHERE NOT revocada` (índice parcial).

### 5.8 Triggers de inmutabilidad

Dos tablas son **históricas y no se pueden modificar ni borrar**:

| Trigger | Tabla | Efecto |
|---|---|---|
| `trg_kardex_inmutable` | `kardex` | Bloquea `UPDATE` y `DELETE`. Solo permite `INSERT` y `TRUNCATE`. |
| `trg_bitacora_inmutable` | `bitacora_acceso` | Bloquea `UPDATE` y `DELETE`. Garantiza que la auditoría no se altere. |

Esto es una decisión de diseño clave: el historial de inventario y la auditoría son **evidencia**, no datos editables.

### 5.9 Modelo relacional resumido (flujo principal)

```
dependencia_municipal ──< empleado ──< usuario >── rol ──< permiso >── submenu ──< menu
        │                                  │
        │                                  ├──< sesion_usuario
        │                                  ├──< usuario_preferencia
        │                                  └──< notificacion
        │
        ├──< presupuesto_dependencia >── periodo_fiscal
        │
        └──< requisicion >── periodo_fiscal
                 │
                 ├──< detalle_requisicion >── insumo >── categoria
                 │                                   └── unidad_medida
                 ├──< requisicion_imagen
                 ├──< proceso_cotizacion
                 │        └──< invitacion_proveedor >── proveedor >── tipo_proveedor
                 │        └──< cotizacion >── proveedor
                 │                 ├──< detalle_cotizacion >── detalle_requisicion
                 │                 └──< documento_cotizacion
                 └──< orden_compra >── proveedor
                          │      └──< detalle_orden_compra
                          ├──< recepcion_bodega >── bodega
                          │        └──< detalle_recepcion_bodega
                          │                 └──< kardex >── insumo_bodega
                          ├──< factura >── proveedor
                          │        └──< orden_pago >── partida_presupuestaria
                          │                       └── fuente_financiamiento
                          └── (vale_salida) ──< detalle_vale_salida >── kardex
```

### 5.10 Máquinas de estado principales

**Requisición**
```
Pendiente → En Revisión → Aprobada → En Compra
     │           │            │
     └───────────┴────────────┴──→ Rechazada / Cancelada
```

**Proceso de cotización**
```
Publicada → Comparación → Adjudicada
     │            │
     └────────────┴──→ Desierta
```

**Cotización**
```
Borrador → Recibida → En Evaluación → Aceptada / Rechazada / Retirada
```

**Orden de compra**
```
Pendiente → Aprobada → Enviada → Entregada
     │
     └──→ Cancelada
```

**Recepción de bodega**
```
En Proceso → Completa / Parcial / Con Novedades
     │
     └──→ Cancelada
```

**Vale de salida**
```
Pendiente → Autorizado → Entregado
     │            │
     └────────────┴──→ Cancelado
```

**Factura**
```
Recibida → En Revisión → Aprobada / Rechazada
```

**Orden de pago**
```
Pendiente → Programada → Pagada
     │            │
     └────────────┴──→ Anulada
```

---

## 6. Seguridad del sistema

### 6.1 Autenticación

- Login con **usuario o correo** y contraseña.
- Contraseñas almacenadas con **bcrypt** (costo 12); nunca en texto plano.
- Token **JWT** firmado con `JWT_SECRET` (mínimo 32 caracteres) y expiración configurable (por defecto `8h`).
- Al iniciar sesión se registra una fila en `sesion_usuario` con el **hash SHA-256 del token**, IP, navegador y expiración.
- El middleware `authenticate` rechaza tokens inválidos, sesiones revocadas, usuarios inactivos y cuentas bloqueadas.

### 6.2 Bloqueo por intentos fallidos

- Tras **5 intentos fallidos**, la cuenta se bloquea **15 minutos** (`intentos_fallidos`, `bloqueado_hasta`).
- Cada intento fallido se registra en bitácora con IP y detalle.

### 6.3 Autorización (RBAC)

- El acceso se controla por **rol → permiso → submenú → controlador**.
- Cada endpoint protegido usa `authorize("controlador")`, por ejemplo `authorize("bodega")`, `authorize("facturacion")`, `authorize("reportes")`, `authorize("configuracion")`, `authorize("auditoria")`.
- El permiso tiene banderas granulares: `puede_ver`, `puede_crear`, `puede_editar`, `puede_aprobar`, `puede_exportar`.
- El menú lateral se construye dinámicamente desde los permisos del rol (`getMenuPermitido`).

### 6.4 Roles del sistema

El sistema parte de 11 roles:

1. Administrador General
2. Encargado de Almacén y Suministros
3. Encargado de Compras / Asistente
4. DAFIM
5. Alcalde Municipal
6. Dependencia Solicitante
7. Soporte Técnico
8. Proveedor
9. Proveedor Estándar
10. Proveedor Premium
11. Distribuidor Mayorista

### 6.5 Protecciones de infraestructura

| Medida | Detalle |
|---|---|
| Helmet | Cabeceras HTTP seguras |
| CORS | Solo orígenes definidos en `CORS_ORIGINS` |
| Rate limit general | 300 peticiones / 15 min por IP en `/api` |
| Rate limit de autenticación | 10 intentos / 15 min en login, recuperar y restablecer |
| Límite de body | `express.json({ limit: "10mb" })` |
| Auditoría inmutable | `bitacora_acceso` con trigger que bloquea UPDATE/DELETE |
| Sesiones revocables | Logout y cierre remoto desde configuración |
| Bitácora de acciones | Login, logout, cambios de estado, reportes, etc. |

### 6.6 Recuperación de contraseña

- Flujo por **correo electrónico** (Brevo API o SMTP Gmail) y por **WhatsApp**.
- Tokens de recuperación hasheados en `token_reset`, con expiración y uso único.
- En desarrollo, si no hay proveedor configurado, el código se imprime en consola.

---

## 7. Módulos funcionales

### 7.1 Dashboard

- Indicadores generales del sistema.
- Gráficos de compras por dependencia y solicitudes por estado.
- Alertas de stock bajo y facturas por vencer.
- Actividad reciente desde bitácora.
- Campana de notificaciones, búsqueda global y ayuda contextual.

**Endpoints:** `GET /api/dashboard/resumen`, `/graficos/compras-por-dependencia`, `/graficos/solicitudes-por-estado`, `/alertas`, `/actividad-reciente`.

### 7.2 Dependencias y solicitudes

- Registro y administración de dependencias municipales.
- Presupuesto por dependencia y período.
- Creación de requisiciones con detalle de insumos o descripción libre.
- Adjuntar documentos PDF de respaldo.
- Flujo de revisión y aprobación con notas.
- Asignación de proveedor y control del monto estimado/adjudicado.
- Exportación de solicitudes a Excel.

**Endpoints:** `/api/dependencias` (7), `/api/requisiciones` (13).

### 7.3 Proveedores

- Registro con NIT, razón social, representante legal y contactos.
- Tipos de proveedor.
- Conexión de un proveedor con una cuenta de portal (`proveedor_usuario`).
- Cambio de rol del portal, reseteo de clave y bloqueo/desbloqueo.
- Resumen y búsqueda.

**Endpoints:** `/api/proveedores` (12).

### 7.4 Proformas y cotizaciones

- Publicación de un proceso de cotización a partir de una requisición aprobada.
- Invitación de proveedores activos.
- Recepción de cotizaciones manuales o desde el portal.
- Comparativa de ofertas por renglón.
- Selección de cotización ganadora y adjudicación.
- Auto-adjudicación y declaratoria de proceso desierto.
- Emisión de orden de compra.
- Documentos PDF de proforma y orden de compra.

**Endpoints:** `/api/proformas` (18).

### 7.5 Facturación

- Registro manual de facturas o recepción desde el portal del proveedor.
- Validación de fecha de vencimiento, monto, serie, número, autorización y NPG.
- Adjuntos PDF/XML y PDF de NPG.
- Revisión con estados `Recibida`, `En Revisión`, `Aprobada`, `Rechazada`.
- Cronograma de vencimientos.
- Órdenes de pago: creación, programación, pago y anulación.
- Control de pago con atraso.

**Endpoints:** `/api/facturas`, `/api/ordenes-pago`, `/api/facturacion/resumen`, `/api/facturacion/cronograma`, `/api/partidas`, `/api/fuentes-financiamiento` (15).

### 7.6 Bodega e inventario

- Bodegas y existencias por insumo.
- Recepción de órdenes de compra con cantidades esperadas, recibidas y aceptadas.
- Recepción total o parcial, ítems con novedades y finalización.
- Ingreso a inventario con actualización de stock.
- Vales de salida con autorización y entrega.
- Kardex de entradas, salidas y ajustes.
- Alertas de stock bajo y crítico.
- Resumen del módulo.

**Endpoints:** `/api/bodega` y rutas de inventario (28, el grupo más grande).

### 7.7 Reportes

Catálogo formal de 8 reportes:

| Código | Reporte | Categoría |
|---|---|---|
| RPT-01 | Kardex por Insumo | Inventario y Kardex |
| RPT-02 | Existencias y Stock Mínimo | Inventario y Kardex |
| RPT-04 | Consumo por Dependencia | Inventario y Kardex |
| RPT-05 | Solicitudes de Compra | Compras |
| RPT-06 | Historial de Compras por Proveedor | Compras |
| RPT-08 | Órdenes de Compra y Cumplimiento | Compras |
| RPT-09 | Recepciones en Bodega | Compras |
| RPT-11 | Resumen Ejecutivo del Almacén | Ejecutivos |

- Filtros por fecha, dependencia, proveedor, categoría, insumo, estado y prioridad.
- Visualización con tablas y gráficos.
- Exportación CSV y generación de PDF.

**Endpoints:** `/api/reportes` (4).

### 7.8 Usuarios, roles y auditoría

- CRUD de usuarios internos y de proveedor.
- Resumen de usuarios, activación/desactivación.
- Reseteo y restablecimiento de contraseña.
- CRUD de roles y asignación de permisos por submenú.
- Consulta de bitácora con filtros, módulos y exportación.
- Gestión de sesiones activas y cierre remoto.

**Endpoints:** `/api/usuarios` (8), `/api/roles` (5), `/api/bitacora` (3), `/api/menus` (1).

### 7.9 Configuración

- **Identidad institucional**: nombre, lema, NIT, colores, logo e imagen de login.
- **Preferencias del usuario**: tema claro/oscuro, color de acento, interfaz compacta, idioma, zona horaria, notificaciones, foto y WhatsApp.
- **Parámetros del sistema**: seguridad, compras, pagos, proveedores, bodega y sistema, con historial de cambios.
- **Períodos fiscales**: crear, activar, cerrar y cargar presupuestos.
- **Catálogos**: categorías, unidades de medida, tipos de proveedor, partidas, fuentes, puestos, dependencias y días inhábiles.
- **Seguridad y accesos**: sesiones y políticas.

**Endpoints:** `/api/configuracion` (16), `/api/catalogos` (8), `/api/periodos-fiscales` (7), `/api/puestos` (3).

### 7.10 Portal del proveedor

Experiencia separada para usuarios con rol de proveedor:

- **Mis oportunidades y cotizaciones**: ver procesos publicados, descargar bases, cotizar, enviar, retirar o declinar.
- **Órdenes y facturas**: consultar órdenes asignadas, órdenes facturables y registrar facturas.
- **Entregas en bodega**: seguimiento de entregas.
- **Configuración**: perfil y preferencias.
- **Notificaciones** propias del portal.
- **Informe** de actividad del proveedor con exportación.

**Endpoints:** `/api/portal` (23).

---

## 8. API REST

### 8.1 Distribución de los 185 endpoints

| Router | Prefijo | Endpoints |
|---|---|---|
| `auth.js` | `/api/auth` | 5 |
| `users.js` | `/api/usuarios` | 8 |
| `roles.js` | `/api/roles` | 5 |
| `menus.js` | `/api/menus` | 1 |
| `dependencies.js` | `/api/dependencias` | 7 |
| `requisiciones.js` | `/api/requisiciones` | 13 |
| `proveedores.js` | `/api/proveedores` | 12 |
| `proformas.js` | `/api/proformas` | 18 |
| `facturacion.js` | `/api` (facturas, órdenes-pago, partidas, fuentes) | 15 |
| `bodega.js` | `/api` (bodegas, inventario, recepciones, kardex, vales) | 28 |
| `reportes.js` | `/api/reportes` | 4 |
| `dashboard.js` | `/api/dashboard` | 5 |
| `puestos.js` | `/api/puestos` | 3 |
| `bitacora.js` | `/api/bitacora` | 3 |
| `portal.js` | `/api/portal` | 23 |
| `configuracion.routes.js` | `/api/configuracion` | 16 |
| `catalogos.routes.js` | `/api/catalogos` | 8 |
| `periodosFiscales.routes.js` | `/api/periodos-fiscales` | 7 |
| `notificaciones.js` | `/api/notificaciones` | 4 |
| **Total** | | **185** |

### 8.2 Endpoints transversales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio y de la base de datos |
| POST | `/api/auth/login` | Inicio de sesión |
| POST | `/api/auth/logout` | Cierre de sesión |
| POST | `/api/auth/cambiar-clave` | Cambio de contraseña |
| POST | `/api/auth/recuperar` | Solicitar código de recuperación |
| POST | `/api/auth/restablecer` | Restablecer contraseña |
| GET | `/api/notificaciones` | Listar notificaciones |
| PATCH | `/api/notificaciones/:id/leida` | Marcar como leída |
| POST | `/api/notificaciones/leer-todas` | Marcar todas |
| DELETE | `/api/notificaciones/:id` | Eliminar notificación |

### 8.3 Convenciones de la API

- Formato JSON.
- Autenticación `Authorization: Bearer <token>`.
- Errores con `{ "error": "mensaje" }`.
- Códigos: `400` validación, `401` no autenticado, `403` sin permiso, `404` no encontrado, `500` error interno.
- Paginación y filtros por query string en los listados.
- Exportaciones con `Content-Type` de CSV/PDF/Excel según el caso.

---

## 9. Flujo de negocio de extremo a extremo

```
1. SOLICITUD
   Dependencia crea requisición → detalle de insumos → adjunta PDF → Pendiente

2. REVISIÓN
   Usuario autorizado revisa → Aprobada / Rechazada → se registra en bitácora

3. COTIZACIÓN
   Se publica proceso → se invita a proveedores → reciben ofertas
   (portal o registro manual) → comparativa → se selecciona ganadora

4. ADJUDICACIÓN
   Se adjudica (manual o automática) → se genera orden de compra
   → requisición queda "adjudicada" y con monto adjudicado

5. ORDEN DE COMPRA
   Pendiente → Aprobada → Enviada → Entregada

6. RECEPCIÓN EN BODEGA
   Bodega recibe la orden → registra cantidades esperadas/recibidas/aceptadas
   → finaliza → ingresa a inventario → genera movimientos de kardex (Entrada)

7. FACTURA
   Proveedor o facturación registra la factura → revisión → Aprobada
   → se controla vencimiento y NPG

8. PAGO
   Se crea orden de pago → se programa → se paga (o se marca atraso)
   → presupuesto: comprometido y pagado se reflejan en la vista

9. CONSUMO
   Dependencia solicita vale de salida → autorización → entrega
   → kardex (Salida) → stock actualizado

10. CONTROL
    Dashboard, reportes, alertas y bitácora consolidan la operación
```

### 9.1 Fórmula presupuestaria

La vista `v_presupuesto_dependencia` establece:

```
asignado     = presupuesto_dependencia.monto_asignado
comprometido = Σ requisiciones en estado Aprobada / En Compra
               (monto_adjudicado si existe, si no monto_estimado)
pagado       = Σ órdenes de pago en estado Pagada
disponible   = asignado − comprometido
```

### 9.2 Fórmula de recepción

- Una orden se considera recibida (`v_recibido_oc`) cuando existe una recepción `Completa`, `Parcial` o `Con Novedades` con al menos un ítem aceptado.
- El monto recibido es el `monto_total` de la orden; el detalle fino queda en `detalle_recepcion_bodega`.

### 9.3 Fórmula de estado de factura

`v_factura_estado` prioriza:

```
Pagada + pagado_atraso → "Pagado con atraso"
Pagada                 → "Pagado"
Rechazada              → "Rechazada"
fecha_vencimiento < hoy→ "Vencido"
en otro caso           → "Pendiente"
```

---

## 10. Reglas de negocio destacadas

1. Una requisición debe pertenecer a una dependencia y a un período fiscal.
2. Cada renglón debe tener un insumo del catálogo **o** una descripción libre, pero no ambos vacíos.
3. Solo se puede cotizar sobre requisiciones aprobadas.
4. Una cotización puede venir del portal o ser registrada manualmente.
5. El proceso de cotización exige un mínimo de ofertas configurable (por defecto 3).
6. La orden de compra puede crearse de forma **provisional** antes de tener cotización y proveedor; esos campos se completan después.
7. No se puede pagar una orden de pago sin fecha real y referencia de pago.
8. Una factura no puede vencer antes de su emisión.
9. Las recepciones no pueden aceptar más de lo recibido.
10. El kardex y la bitácora no se pueden editar ni borrar.
11. Un período fiscal no puede estar activo y cerrado al mismo tiempo.
12. Los archivos de requisición solo admiten PDF.
13. El presupuesto disponible se calcula, no se almacena manualmente.
14. Los usuarios proveedor deben estar vinculados a un proveedor y no tienen empleado interno.
15. Las alertas de stock y vencimiento no se repiten dentro de una ventana de 24 horas.

---

## 11. Servicios internos del backend

| Servicio | Función |
|---|---|
| `mailer.js` | Envío de correos por Brevo (API HTTP) o Gmail (SMTP); modo desarrollo en consola. |
| `whatsapp.js` | Envío de códigos de recuperación por WhatsApp; modo desarrollo en consola. |
| `notificaciones.service.js` | Notificaciones en sistema y correo respetando preferencias; envío en bloque y control de spam. |
| `alertas.service.js` | Detección periódica de stock bajo y facturas por vencer/vencidas. |
| `bitacora.service.js` | Registro centralizado de auditoría con IP. |
| `presupuesto.service.js` | Resumen y disponibilidad presupuestaria desde la vista. |
| `menu.service.js` | Construcción del menú permitido por rol. |
| `parametros.service.js` | Lectura y validación de parámetros del sistema. |
| `eventos.js` | Emisor de eventos internos (`EventEmitter`) para desacoplar módulos. |

Las alertas se ejecutan **al arrancar el servidor** y luego **cada 60 segundos** mediante `sincronizarAlertas()`.

---

## 12. Frontend

### 12.1 Organización

| Carpeta | Contenido |
|---|---|
| `src/api/` | Clientes HTTP por módulo (`auth`, `bodega`, `facturacion`, `proformas`, `portal`, etc.) |
| `src/controllers/` | Hooks de lógica de pantalla (`useAppController`, `useBodegaController`, etc.) |
| `src/views/` | Pantallas y modales agrupados por módulo |
| `src/models/` | Tipos e interfaces del dominio |
| `src/lib/` | Generación de PDF y Excel en cliente |
| `src/utils/` | Fechas, menú y permisos |
| `src/constants/theme.ts` | Tokens de diseño (`G`, `GL`, `GB`, `ACCENT_PALETTE`) |
| `src/index.css` | Tailwind v4, variables de tema, modo oscuro y modo compacto |

### 12.2 Experiencias

- **Pantalla de login** con recuperación por correo/WhatsApp.
- **Cambio obligatorio de clave** en el primer ingreso.
- **Layout administrativo** con barra lateral dinámica, búsqueda, notificaciones, ayuda y perfil.
- **Portal de proveedores** independiente.
- **Modales reutilizables**: PDF, confirmación, toasts, dropdowns, selectores de fecha.
- **Modo oscuro** (`[data-theme="dark"]`) y **modo compacto** (`[data-compact="true"]`).
- **Exportaciones**: Excel (exceljs), PDF (pdf-lib) y CSV generado por el backend.

### 12.3 Alias y build

- Alias `@` → `src/` (configurado en `tsconfig.json` y `vite.config.ts`).
- `npm run dev` levanta Vite en `0.0.0.0:8443` con proxy `/api` → `http://localhost:4000`.
- `npm run build` genera el sitio estático en `dist/`.
- `npm run format` ejecuta `oxfmt`.

---

## 13. Despliegue y operación

### 13.1 Variables de entorno del backend

| Variable | Uso |
|---|---|
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | Conexión local a PostgreSQL |
| `DATABASE_URL` | Cadena remota (Neon/Render) con prioridad sobre las anteriores |
| `PGSSL` | `false` desactiva SSL |
| `PGPOOL_MAX` | Tamaño máximo del pool |
| `JWT_SECRET` | Secreto obligatorio de al menos 32 caracteres |
| `JWT_EXPIRES_IN` | Expiración del token (por defecto `8h`) |
| `PORT` | Puerto del backend (4000) |
| `CORS_ORIGINS` | Orígenes permitidos |
| `APP_URL` | URL pública usada en enlaces de correo |
| `BREVO_API_KEY`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME` | Correo por API |
| `GMAIL_USER`, `GMAIL_PASS` | Correo por SMTP |
| `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_ID` | WhatsApp |

### 13.2 Docker Compose

Tres servicios:

- `db`: PostgreSQL 18-alpine, puerto host 5433, volumen `pgdata`, migraciones y seeds montados.
- `backend`: Node 22, puerto 4000, depende de `db` saludable.
- `frontend`: Vite en 8443, depende del backend saludable.

Healthchecks: `pg_isready` para la base y `GET /api/health` para el backend.

### 13.3 Render

- `municompras-api`: servicio web Node, `rootDir: Backend`, build `npm ci`, start `npm start`, health check `/api/health`.
- `municompras-web`: sitio estático, `rootDir: Frontend/municompras-web`, build `npm ci && npm run build`, publicación en `dist`, rewrite a `index.html`.
- Base de datos remota mediante `DATABASE_URL` (Neon recomendado).

### 13.4 Migraciones y respaldos

- Migraciones SQL numeradas en `Backend/migrations/`.
- Seeds en `Backend/seeds/`.
- Scripts utilitarios: `run_migration.cjs`, `run_sql.cjs`, `test_api.cjs`, `test-mail.mjs`, `importar-kardex.mjs`, `cargar-dependencias.mjs`.
- Respaldos en `Backend/backups/`.
- El kardex histórico se importó desde `kardex/CARDEX..xlsx` (script `importar-kardex.mjs`).

---

## 14. Datos y catálogos iniciales

El sistema incluye seeds con:

- 8 dependencias municipales (DMP, DAFIM, DMM, OMSAN, DIGAM, Secretaría, Despacho, Compras y Almacén).
- 8 puestos con salario base.
- 11 roles (internos y de proveedor).
- 10 menús y 19 submenús.
- Usuarios de demostración con clave inicial `Admin1234` y cambio obligatorio.
- Parámetros del sistema agrupados en SEGURIDAD, COMPRAS, PAGOS, PROVEEDORES, BODEGA y SISTEMA.
- Catálogo de insumos y movimientos de kardex históricos.

Parámetros destacados:

| Clave | Valor por defecto | Grupo |
|---|---|---|
| `CLAVE_LONGITUD_MIN` | 8 | Seguridad |
| `INTENTOS_FALLIDOS_MAX` | 5 | Seguridad |
| `BLOQUEO_MINUTOS` | 15 | Seguridad |
| `SESION_INACTIVIDAD_MIN` | 30 | Seguridad |
| `MIN_OFERTAS_DEFECTO` | 3 | Compras |
| `APROBACION_OC` | NO | Compras |
| `DIAS_HABILES_PAGO` | 8 | Pagos |
| `CONTROL_RECEPCION_PAGO` | ADVERTIR | Pagos |
| `TOLERANCIA_FACTURA` | 0 | Pagos |
| `STOCK_CRITICO_PORCENTAJE` | 50 | Bodega |
| `ARCHIVO_MAX_MB` | 5 | Sistema |
| `REFRESCO_SEGUNDOS` | 60 | Sistema |
| `ZONA_HORARIA_DEFECTO` | America/Guatemala | Sistema |

---

## 15. Fortalezas del diseño

1. **Trazabilidad completa**: cada compra se puede seguir desde la requisición hasta el pago mediante `v_expediente`.
2. **Integridad fuerte**: llaves foráneas, CHECK, columnas generadas y vistas reducen datos inconsistentes.
3. **Auditoría confiable**: bitácora y kardex inmutables.
4. **Seguridad por capas**: JWT, bcrypt, RBAC, bloqueo, rate limit, helmet, CORS y sesiones revocables.
5. **Presupuesto calculado en tiempo real**: no hay saldos duplicados.
6. **Portal de proveedores integrado**: el proveedor participa sin depender del correo.
7. **Notificaciones y alertas automáticas**: stock bajo y vencimientos.
8. **Arquitectura desacoplada**: frontend SPA + API REST + base relacional.
9. **Parametrización**: reglas clave configurables sin recompilar.
10. **Despliegue reproducible**: Docker Compose y Render.

---

## 16. Limitaciones y recomendaciones

| Aspecto | Observación | Recomendación |
|---|---|---|
| Pruebas automatizadas | No hay suite de tests ni lint/typecheck | Incorporar pruebas de API y E2E, y un pipeline de CI |
| Archivos en base64 | PDFs/XML se guardan en columnas `TEXT`/`BYTEA` | Evaluar almacenamiento de objetos (S3/MinIO) para escala |
| Reportes | 8 reportes definidos | Agregar más reportes según necesidades de la institución |
| Notificaciones | Sondeo cada 60 s | Evaluar WebSockets/SSE para tiempo real |
| Correo | Depende de Brevo o Gmail | Formalizar dominio y remitente institucional |
| Respaldos | Archivos locales en `Backend/backups/` | Automatizar respaldo cifrado y prueba de restauración |
| Contraseñas iniciales | Seeds con `Admin1234` | Forzar cambio y rotación en producción |
| Documentación | Manuales en `.docx` | Mantener documentación técnica versionada junto al código |

---

## 17. Preguntas frecuentes de defensa

**¿Cuántas tablas tiene el sistema?**
46 tablas, más 5 vistas, 2 triggers y 2 funciones de trigger.

**¿Cuál es la tabla central del proceso?**
`requisicion`. De ella cuelgan el detalle, las cotizaciones, la orden de compra, la recepción, la factura y el pago.

**¿Cómo se garantiza que no se altere la auditoría?**
Con el trigger `trg_bitacora_inmutable`, que bloquea `UPDATE` y `DELETE` sobre `bitacora_acceso`.

**¿Cómo se calcula el presupuesto disponible?**
Con la vista `v_presupuesto_dependencia`: asignado − comprometido. El pagado se toma de órdenes de pago pagadas.

**¿Cómo se controla el acceso?**
Con RBAC: rol → permiso → submenú → controlador. Cada endpoint usa `authorize("controlador")`.

**¿Qué pasa si un usuario falla 5 veces la contraseña?**
Se bloquea 15 minutos y se registra el intento en la bitácora.

**¿Cómo se mantiene el kardex?**
Cada recepción o vale genera movimientos de `Entrada` o `Salida` con stock anterior y actual; el trigger impide modificarlos.

**¿Cómo participa el proveedor?**
A través del portal: ve oportunidades, cotiza, sube documentos, consulta órdenes y registra facturas. Su usuario se vincula con `proveedor_usuario`.

**¿Cómo se evita pagar sin recibir?**
Con el parámetro `CONTROL_RECEPCION_PAGO` (NO / ADVERTIR / BLOQUEAR) y la vista `v_recibido_oc`.

**¿Cómo se maneja un pago atrasado?**
La orden de pago tiene `pagado_atraso`; la vista `v_factura_estado` muestra "Pagado con atraso".

---

## 18. Glosario

| Término | Significado |
|---|---|
| Requisición | Solicitud formal de compra de una dependencia. |
| Proforma / cotización | Oferta económica de un proveedor. |
| Proceso de cotización | Convocatoria y comparación de ofertas. |
| Adjudicación | Selección del proveedor y la oferta ganadora. |
| Orden de compra | Documento formal que compromete la compra. |
| Recepción | Registro de ingreso de bienes a bodega. |
| Kardex | Historial de movimientos de inventario. |
| Vale de salida | Autorización de despacho de insumos a una dependencia. |
| NPG | Número de pago / documento de egreso. |
| Período fiscal | Año o ejercicio presupuestario. |
| Partida presupuestaria | Clasificación del gasto. |
| Fuente de financiamiento | Origen de los fondos. |
| Bitácora | Registro inmutable de acciones del sistema. |
| RBAC | Control de acceso basado en roles. |
| JWT | Token firmado de sesión. |

---

## 19. Conclusiones

MuniCompras es un sistema completo, coherente y trazable. Su mayor fortaleza está en la **base de datos**: 46 tablas bien normalizadas, con relaciones explícitas, restricciones de integridad, vistas de cálculo y dos tablas históricas inmutables. Sobre esa base, la API REST expone 185 endpoints organizados por módulos y el frontend ofrece dos experiencias claras: el portal interno municipal y el portal de proveedores.

El diseño permite responder con precisión a las preguntas clave de una defensa de sistema:

- **Qué datos guarda:** 46 tablas distribuidas en 9 dominios.
- **Cómo se relacionan:** mediante llaves foráneas y un flujo único de compras.
- **Cómo se protege:** JWT, bcrypt, RBAC, rate limit, sesiones revocables y auditoría inmutable.
- **Cómo se controla el dinero:** presupuesto calculado por vistas y órdenes de pago con estados.
- **Cómo se controla el inventario:** recepciones, vales y kardex inmutable.
- **Cómo participa el proveedor:** portal con cotizaciones, órdenes, entregas y facturas.

Con este documento se puede sustentar la presentación técnica y funcional del sistema sin necesidad de modificar el código ni la base de datos.

---

*Documento de estudio generado a partir del análisis del código fuente, las migraciones `001`–`081` y el respaldo `docker/local-db/local.sql`. No se realizaron cambios en el sistema.*
