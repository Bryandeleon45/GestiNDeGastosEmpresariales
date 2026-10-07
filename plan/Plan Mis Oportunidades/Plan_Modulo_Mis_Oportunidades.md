# Plan de Desarrollo — Módulo "Mis oportunidades" (Portal del Proveedor)

**Proyecto:** Sistema Web para la Gestión de la Cadena de Suministro de Proveedores — Municipalidad de Panajachel
**Fuentes:** DERCAS (versión final, 27/07/2026) y tesis de graduación
**Módulo:** Mis oportunidades, dentro del Módulo de Autenticación y Portal del Proveedor

---

## 1. Resumen, interpretación y alcance

### 1.1 Aviso importante: el nombre del módulo no aparece en los documentos

Ni el DERCAS ni la tesis mencionan "Mis oportunidades". Este plan **interpreta** el módulo a partir de lo que sí describen para el Portal del Proveedor:

| Fuente | Qué dice |
|---|---|
| DERCAS, Módulo de Autenticación y Portal del Proveedor | El proveedor inicia sesión, gestiona su perfil, **recibe notificaciones de requerimientos municipales, carga sus cotizaciones o proformas y da seguimiento al estado de sus ventas y pagos**. |
| Tesis, 4.4 Procesos de negocio | El departamento de compras **publica** qué insumos o servicios necesita; los proveedores **reciben la notificación**, ingresan a su panel y **suben sus ofertas** (precios, detalles y tiempos de entrega) sin llevar papelería. El sistema reúne las propuestas para compararlas. |
| Tesis, tabla de procesos (paso 3) | "Publicación de la necesidad de compra en el portal" → "Carga de propuestas económicas, especificaciones técnicas y tiempos de entrega" → "Cuadro comparativo de proformas". |
| DERCAS, Módulo de Proformas | Comparativa de proformas, adjudicación formal de la oferta ganadora y generación de la orden de compra. |

**Definición adoptada:** una **oportunidad** es un requerimiento de compra publicado por el área de Compras al que un proveedor habilitado fue invitado a cotizar. "Mis oportunidades" es la sección donde el proveedor:

1. Ve las oportunidades abiertas dirigidas a él.
2. Consulta el detalle (insumos, cantidades, especificaciones, fecha límite, lugar de entrega).
3. Prepara y envía su cotización o proforma, o declina participar.
4. Da seguimiento a sus cotizaciones hasta el resultado (adjudicada o no adjudicada).
5. Recibe notificaciones del proceso.

Si tu idea de "oportunidades" es distinta (por ejemplo, un catálogo público abierto a cualquier empresa), avísame y ajusto el plan. Ver preguntas abiertas en la sección 12.

### 1.2 Dentro del alcance

- Listado de oportunidades del proveedor con pestañas, filtros y búsqueda.
- Detalle de la oportunidad.
- Cotización: borrador, edición, envío, retiro y declinación.
- Adjuntos de la proforma (PDF o imagen).
- Estados de la oportunidad desde la perspectiva del proveedor.
- Notificaciones dentro del portal y por correo.
- Indicadores resumidos (abiertas, por vencer, en evaluación, adjudicadas).
- Aislamiento total de datos entre proveedores.

### 1.3 Fuera del alcance (otros módulos o Delimitaciones del DERCAS)

- **Publicar el requerimiento e invitar proveedores, evaluar y adjudicar:** lo hacen Compras y el módulo de Proformas. Este plan solo define las **tablas y el contrato mínimo** que esos módulos deben cumplir.
- **Seguimiento de órdenes, ventas y pagos del proveedor:** es otra sección del portal. "Mis oportunidades" solo enlaza a la orden cuando una cotización es adjudicada.
- **Carga de facturas (FEL) y emisión de FEL:** el DERCAS excluye la emisión o certificación en línea.
- **Integración con Guatecompras o SICOIN:** excluida por las Delimitaciones.
- **Registro del proveedor, gestión de su ficha y documentos legales:** módulo de Proveedores.
- **Pagos en línea:** excluidos.

---

## 2. Tecnologías (según el DERCAS)

| Capa | Tecnología del DERCAS | Uso en el módulo |
|---|---|---|
| Front-end | React, HTML5, CSS3 (Flexbox y Grid) | Pantallas del portal: lista, detalle, formulario de cotización; diseño responsivo. |
| Back-end | Node.js | API REST del portal, reglas de plazo, validaciones, carga de archivos, tareas programadas. |
| Base de datos | PostgreSQL | Modelo relacional, restricciones de unicidad e integridad, transacciones. |
| Infraestructura | Microsoft Azure, Docker | Contenedores y despliegue; Azure también puede alojar los archivos adjuntos. |
| Control de versiones | Git, GitHub | Ramas `feature/portal-oportunidades-*`. |
| Pruebas de API | Postman | Colección con casos de aislamiento entre proveedores y de plazos. |
| Metodología | Scrum / PMBOK, patrón MVC | Entregas por sprint. |

### 2.1 Librerías y servicios propuestos (no vienen en los documentos)

| Necesidad | Opción sugerida |
|---|---|
| Framework HTTP | Express |
| Acceso a PostgreSQL | `pg` con consultas parametrizadas (o Knex) |
| Autenticación | JSON Web Token (JWT) con `contrasenaHash` en bcrypt o argon2 |
| Seguridad HTTP | `helmet`, `express-rate-limit`, CORS restringido |
| Validación | Zod o Joi |
| Carga de archivos | `multer` |
| Almacenamiento de adjuntos | Azure Blob Storage (o un volumen Docker en la primera versión) |
| Correo | Nodemailer con un SMTP institucional o un servicio de correo transaccional |
| Tareas programadas (recordatorios, cierre) | `node-cron` |
| Formularios en React | React Hook Form |
| Consulta y caché de datos en el cliente | TanStack Query |

### 2.2 Inconsistencias de los documentos que afectan al módulo

1. **Back-end:** el DERCAS indica **Node.js** en la sección de stack y **.NET Core** en las revisiones documentales. Este plan sigue Node.js.
2. **Sintaxis SQL:** el diccionario de datos usa sintaxis de SQL Server (`IDENTITY`, `GETDATE()`, `datetime`), pero el motor declarado es **PostgreSQL**. Equivalencias: `GENERATED ALWAYS AS IDENTITY`, `now()`, `TIMESTAMPTZ`, `NUMERIC(12,2)`.
3. **Diagramas ER distintos:** el DERCAS describe 18 tablas y la tesis menciona otras entidades (`BITACORA_ACCESO`, `REQUISICION`, `BODEGA`, `KARDEX`). Este plan usa el **diccionario de datos del DERCAS** como base. Los diagramas ER de ambos documentos son imágenes que no pude leer como texto.
4. **Guatecompras:** la tesis menciona validar el NPG de Guatecompras al registrar facturas; el DERCAS lo excluye. No afecta a este módulo.

---

## 3. Modelo entidad-relación aplicado al módulo

### 3.1 Tablas existentes y su uso

| Tabla | Uso en "Mis oportunidades" |
|---|---|
| `Proveedor` (`estado`, `nit`, `correo`) | Identidad del proveedor; solo `Activo` puede cotizar. |
| `Usuario`, `Persona`, `Rol`, `Permiso`, `Rol_Permiso` | Credenciales y permisos del proveedor en el portal (rol `Proveedor`). |
| `SolicitudCompra` (`justificacion`, `prioridad`, `idDependencia`) | Origen del requerimiento. |
| `DetalleSolicitud` (`idInsumo`, `cantidadSolicitada`, `observaciones`) | Líneas a cotizar. |
| `Insumo`, `CategoriaInsumo` | Nombre, unidad de medida y categoría de cada línea. |
| `Dependencia` | Dependencia solicitante (para mostrar al proveedor, si se decide). |
| `Cotizacion` (`montoTotal`, `condicionesPago`, `tiempoEntrega`, `fechaValidez`, `estado`) | Cotización del proveedor. |
| `DetalleCotizacion` (`cantidadCotizada`, `precioUnitario`, `subtotal`) | Precios por línea. |
| `OrdenCompra` | Resultado si la cotización es adjudicada. |

### 3.2 Relaciones clave

```
SolicitudCompra 1─N DetalleSolicitud N─1 Insumo
SolicitudCompra 1─N Cotizacion N─1 Proveedor
Cotizacion 1─N DetalleCotizacion N─1 Insumo
SolicitudCompra 1─N OrdenCompra N─1 Proveedor
Usuario N─1 Rol N─N Permiso (vía Rol_Permiso)
```

### 3.3 Brechas del modelo (críticas para este módulo)

El diccionario de datos **no tiene lo necesario** para publicar oportunidades a proveedores. Hay que completar el modelo antes de programar:

| Brecha | Por qué importa | Propuesta |
|---|---|---|
| **No hay vínculo entre `Usuario` y `Proveedor`.** | Sin él, el sistema no sabe qué empresa representa el usuario que inició sesión; es la base del aislamiento de datos. | Agregar `idProveedor` (nullable, único) a `Usuario`, o tabla `UsuarioProveedor` si una empresa tendrá varios usuarios. |
| **No existe el concepto de publicación** (fecha límite, condiciones, estado de la convocatoria). `SolicitudCompra.estado` solo tiene `Pendiente`, `Aprobada`, `Rechazada`, `En Compra`. | No hay dónde guardar "abierta hasta el día X". | Tabla nueva `PublicacionRequerimiento`. |
| **No existe invitación por proveedor.** | La tesis habla de proveedores "habilitados" que reciben notificación; no se sabe a quiénes se invitó ni si vieron la oportunidad. | Tabla nueva `InvitacionProveedor`. |
| **No existen notificaciones.** | El DERCAS promete notificaciones de requerimientos al proveedor. | Tabla nueva `Notificacion`. |
| **No hay adjuntos para proformas.** | El DERCAS dice "cargar sus cotizaciones o proformas" y la tesis, "especificaciones técnicas". | Tabla nueva `DocumentoCotizacion`. |
| `Cotizacion` **no enlaza a la publicación** ni guarda el motivo de la decisión. | Si se republica un requerimiento, no se distingue la ronda; el proveedor no ve por qué se adjudicó o no. La tesis pide "justificación de adjudicación". | Agregar `idPublicacion` y `motivoDecision` a `Cotizacion`. |
| `Proveedor` **no guarda categorías de suministro** (el DERCAS las menciona en la ficha del proveedor). | La invitación automática por categoría no es posible. | Fase 1: Compras elige manualmente a quién invitar. Fase 2: tabla `ProveedorCategoria` (N:N con `CategoriaInsumo`). |
| `Cotizacion.estado` no contempla borrador ni retiro. | El proveedor necesita guardar avance y poder retirarse. | Agregar los valores `Borrador` y `Retirada`. |

### 3.4 Tablas nuevas y cambios propuestos (PostgreSQL)

```sql
-- 1) Vínculo usuario-proveedor (base del aislamiento de datos)
ALTER TABLE Usuario ADD COLUMN idProveedor INT NULL REFERENCES Proveedor(idProveedor);
CREATE UNIQUE INDEX uq_usuario_proveedor ON Usuario (idProveedor) WHERE idProveedor IS NOT NULL;
-- (si una empresa tendrá varios usuarios, quitar el índice único y crear UsuarioProveedor)

-- 2) Publicación del requerimiento
CREATE TABLE PublicacionRequerimiento (
  idPublicacion      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  idSolicitud        INT NOT NULL REFERENCES SolicitudCompra(idSolicitud),
  fechaPublicacion   TIMESTAMPTZ NOT NULL DEFAULT now(),
  fechaLimite        TIMESTAMPTZ NOT NULL,
  lugarEntrega       VARCHAR(255) NULL,
  condiciones        TEXT NULL,                       -- especificaciones técnicas y requisitos
  estado             VARCHAR(20) NOT NULL DEFAULT 'Abierta',
                     -- 'Abierta','Cerrada','Adjudicada','Cancelada'
  idUsuarioPublica   INT NOT NULL REFERENCES Usuario(idUsuario),
  CHECK (estado IN ('Abierta','Cerrada','Adjudicada','Cancelada'))
);

-- 3) Invitación por proveedor
CREATE TABLE InvitacionProveedor (
  idInvitacion    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  idPublicacion   INT NOT NULL REFERENCES PublicacionRequerimiento(idPublicacion),
  idProveedor     INT NOT NULL REFERENCES Proveedor(idProveedor),
  fechaInvitacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fechaVista      TIMESTAMPTZ NULL,
  estado          VARCHAR(20) NOT NULL DEFAULT 'Invitado',  -- 'Invitado','Declinó'
  motivoDeclina   VARCHAR(255) NULL,
  UNIQUE (idPublicacion, idProveedor)
);

-- 4) Cambios en Cotizacion
ALTER TABLE Cotizacion ADD COLUMN idPublicacion INT NULL REFERENCES PublicacionRequerimiento(idPublicacion);
ALTER TABLE Cotizacion ADD COLUMN motivoDecision VARCHAR(500) NULL;
ALTER TABLE Cotizacion ADD COLUMN fechaEnvio TIMESTAMPTZ NULL;
-- Valores de estado: 'Borrador','Recibida','En Evaluación','Aceptada','Rechazada','Retirada'
CREATE UNIQUE INDEX uq_cotizacion_pub_prov
  ON Cotizacion (idPublicacion, idProveedor) WHERE estado <> 'Retirada';

-- 5) Adjuntos de la proforma
CREATE TABLE DocumentoCotizacion (
  idDocumento     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  idCotizacion    INT NOT NULL REFERENCES Cotizacion(idCotizacion),
  nombreOriginal  VARCHAR(255) NOT NULL,
  rutaAlmacen     VARCHAR(500) NOT NULL,   -- clave en Azure Blob o ruta en volumen
  tipoMime        VARCHAR(100) NOT NULL,
  tamanoBytes     INT NOT NULL,
  hashSha256      CHAR(64) NOT NULL,
  fechaCarga      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) Notificaciones (portal y correo)
CREATE TABLE Notificacion (
  idNotificacion  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  idUsuario       INT NOT NULL REFERENCES Usuario(idUsuario),
  tipo            VARCHAR(40) NOT NULL,
  titulo          VARCHAR(150) NOT NULL,
  mensaje         VARCHAR(500) NOT NULL,
  referenciaTipo  VARCHAR(30) NULL,        -- 'Publicacion','Cotizacion','OrdenCompra'
  referenciaId    INT NULL,
  leida           BOOLEAN NOT NULL DEFAULT FALSE,
  fechaCreacion   TIMESTAMPTZ NOT NULL DEFAULT now(),
  fechaCorreo     TIMESTAMPTZ NULL,
  UNIQUE (idUsuario, tipo, referenciaTipo, referenciaId)   -- evita recordatorios duplicados
);

-- 7) Permisos del módulo (se insertan en la tabla Permiso existente)
-- portal.oportunidades.ver, portal.cotizaciones.crear,
-- portal.cotizaciones.editar, portal.documentos.subir
-- y el rol 'Proveedor' con esos permisos en Rol_Permiso
```

Reutiliza `BitacoraAccion` (propuesta en el plan de Reportes) para registrar ver, enviar, retirar y declinar.

---

## 4. Estados de una oportunidad (vista del proveedor)

La base de datos no guarda un "estado de la oportunidad": se **deriva** de la invitación, la publicación y la cotización.

| Estado | Condición |
|---|---|
| **Nueva** | Publicación abierta, dentro del plazo, el proveedor aún no la ha visto. |
| **Abierta** | Publicación abierta, dentro del plazo, sin cotización enviada (puede tener borrador). |
| **Cotizada** | Cotización en `Recibida` o `En Evaluación`. |
| **Adjudicada** | Cotización `Aceptada`. |
| **No adjudicada** | Cotización `Rechazada`, o la publicación está `Adjudicada` y la cotización no fue la aceptada. |
| **Declinada** | El proveedor declinó la invitación. |
| **Vencida** | Venció la fecha límite sin cotización enviada y la publicación sigue `Abierta`. |
| **Cerrada** | Publicación `Cerrada` o `Adjudicada` sin participación del proveedor. |
| **Cancelada** | Publicación `Cancelada` por la municipalidad. |

```
Invitado → Visto → Borrador → Enviada (Recibida) → En Evaluación → Aceptada → OrdenCompra
                 ↘ Declinada              ↘ Retirada            ↘ Rechazada
```

### 4.1 Vista SQL base

```sql
CREATE OR REPLACE VIEW vw_portal_oportunidades AS
SELECT
  inv.idProveedor,
  p.idPublicacion,
  p.idSolicitud,
  d.nombreDependencia,
  s.prioridad,
  s.justificacion,
  p.fechaPublicacion,
  p.fechaLimite,
  inv.fechaVista,
  c.idCotizacion,
  c.montoTotal,
  c.fechaEnvio,
  CASE
    WHEN p.estado = 'Cancelada'                                         THEN 'Cancelada'
    WHEN inv.estado = 'Declinó'                                         THEN 'Declinada'
    WHEN c.estado = 'Aceptada'                                          THEN 'Adjudicada'
    WHEN c.estado = 'Rechazada'
      OR (p.estado = 'Adjudicada' AND c.estado IN ('Recibida','En Evaluación'))
                                                                        THEN 'No adjudicada'
    WHEN c.estado IN ('Recibida','En Evaluación')                       THEN 'Cotizada'
    WHEN p.estado = 'Abierta' AND p.fechaLimite > now()
         THEN CASE WHEN inv.fechaVista IS NULL THEN 'Nueva' ELSE 'Abierta' END
    WHEN p.estado = 'Abierta'                                           THEN 'Vencida'
    ELSE 'Cerrada'
  END AS estadoOportunidad
FROM InvitacionProveedor inv
JOIN PublicacionRequerimiento p ON p.idPublicacion = inv.idPublicacion
JOIN SolicitudCompra s          ON s.idSolicitud = p.idSolicitud
JOIN Dependencia d              ON d.idDependencia = s.idDependencia
LEFT JOIN Cotizacion c          ON c.idPublicacion = p.idPublicacion
                               AND c.idProveedor = inv.idProveedor
                               AND c.estado <> 'Retirada';
```

> La vista **siempre** se consulta con `WHERE idProveedor = <el del usuario autenticado>`. Un borrador (`Borrador`) cae en "Abierta" mientras la publicación siga abierta.

---

## 5. Reglas de negocio

| # | Regla |
|---|---|
| RN-01 | El proveedor solo ve oportunidades a las que fue **invitado**. |
| RN-02 | Solo un proveedor con `Proveedor.estado = 'Activo'` y `Usuario.estado = 'Activo'` puede cotizar; si está `Suspendido`, puede consultar pero no enviar. |
| RN-03 | Una sola cotización vigente por proveedor y publicación (restricción `UNIQUE`). |
| RN-04 | Se puede crear, editar, retirar y declinar **solo antes de `fechaLimite`** y con la publicación `Abierta`. La validación es en el servidor, dentro de la transacción. |
| RN-05 | El proveedor cotiza las líneas de `DetalleSolicitud` (insumo y cantidad fijados por la municipalidad); solo ingresa el precio unitario. *(Cotizar todas las líneas es obligatorio por defecto; ver pregunta 4.)* |
| RN-06 | `precioUnitario > 0`; `subtotal = cantidad × precio` y `montoTotal = Σ subtotal` los **calcula el servidor**, nunca se confía en los del cliente. |
| RN-07 | `fechaValidez` debe ser posterior a `fechaLimite`; `tiempoEntrega` y `condicionesPago` son obligatorios para enviar. |
| RN-08 | Al enviar, el estado pasa de `Borrador` a `Recibida`, se guarda `fechaEnvio` y se emite una constancia al proveedor. |
| RN-09 | El proveedor **nunca ve** cotizaciones, precios ni nombres de otros proveedores. |
| RN-10 | Al adjudicarse, el proveedor ve el resultado y el `motivoDecision`; los no adjudicados ven su resultado sin datos de la competencia. |
| RN-11 | Los adjuntos se limitan por tipo (PDF, JPG, PNG; opcionalmente XLSX) y tamaño (propuesta: 10 MB por archivo, 5 archivos). |
| RN-12 | Toda acción relevante se registra en `BitacoraAccion`. |

---

## 6. Arquitectura del módulo

```
React (SPA portal) ──HTTPS/JSON──► API Node.js (MVC) ──SQL──► PostgreSQL
 /portal/oportunidades             /api/portal/*                tablas + vista
 lista, detalle, cotizar           JWT + alcance por proveedor  restricciones UNIQUE
                                   subida de archivos ──────► Azure Blob / volumen
                                   node-cron ───► recordatorios, cierre, correos
```

### 6.1 Estructura de carpetas sugerida (back-end)

```
src/modules/portal-oportunidades/
├── oportunidades.routes.js       # rutas + middleware (autenticación, rol Proveedor)
├── oportunidades.controller.js
├── oportunidades.service.js      # reglas RN-01 a RN-12, transacciones
├── oportunidades.repository.js   # SQL parametrizado, siempre con idProveedor del token
├── cotizaciones.service.js       # cálculo de totales, validaciones, envío, retiro
├── documentos.service.js         # carga/descarga, validación de tipo, hash
├── notificaciones.service.js     # creación, correo, recordatorios
├── jobs/                         # cierre de publicaciones, recordatorio 24 h antes
└── validadores/
```

### 6.2 Estructura de carpetas sugerida (front-end)

```
src/modules/portal/oportunidades/
├── pages/ OportunidadesPage.jsx, DetalleOportunidadPage.jsx
├── components/ ResumenOportunidades.jsx, OportunidadCard.jsx, FiltrosOportunidades.jsx,
│               EstadoBadge.jsx, CuentaRegresiva.jsx, FormularioCotizacion.jsx,
│               TablaItemsCotizar.jsx, CargaAdjuntos.jsx, ModalConfirmarEnvio.jsx,
│               ModalDeclinar.jsx, CampanaNotificaciones.jsx
├── hooks/ useOportunidades.js, useCotizacion.js
└── services/ portalApi.js
```

### 6.3 Contrato de la API (todos los endpoints exigen sesión de proveedor)

El `idProveedor` **sale del token**, nunca del cuerpo ni de la URL.

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/portal/oportunidades/resumen` | Indicadores: abiertas, por vencer (24-48 h), cotizadas en evaluación, adjudicadas del año. |
| GET | `/api/portal/oportunidades` | Lista con `tab` (`abiertas`, `cotizadas`, `adjudicadas`, `historial`), `estado`, `q`, `fechaDesde`, `fechaHasta`, `page`, `pageSize`. |
| GET | `/api/portal/oportunidades/:idPublicacion` | Detalle: líneas, condiciones, fecha límite, lugar de entrega, su cotización y adjuntos. Marca `fechaVista` la primera vez. |
| PUT | `/api/portal/oportunidades/:idPublicacion/cotizacion` | Crea o actualiza el **borrador** (guardado automático). |
| POST | `/api/portal/oportunidades/:idPublicacion/cotizacion/enviar` | Valida y envía; responde con la constancia. |
| POST | `/api/portal/oportunidades/:idPublicacion/cotizacion/retirar` | Retira antes del plazo. |
| POST | `/api/portal/oportunidades/:idPublicacion/declinar` | Declina con motivo opcional. |
| POST | `/api/portal/cotizaciones/:idCotizacion/documentos` | Sube un adjunto. |
| GET | `/api/portal/cotizaciones/:idCotizacion/documentos/:idDocumento` | Descarga (solo del dueño). |
| DELETE | `/api/portal/cotizaciones/:idCotizacion/documentos/:idDocumento` | Elimina un adjunto mientras la cotización sea `Borrador`. |
| GET | `/api/portal/notificaciones` | Lista y contador de no leídas. |
| PATCH | `/api/portal/notificaciones/:id/leida` | Marca como leída. |

**Códigos de error esperados:** 400 validación, 401 sin sesión, 403 sin permiso o proveedor suspendido, 404 si la oportunidad **no es del proveedor** (no revelar que existe), 409 cotización duplicada o ya enviada, 410 plazo vencido.

### 6.4 Contrato mínimo que deben cumplir los módulos de Compras y Proformas

Para que este módulo funcione, esos módulos deben:

| Acción de Compras | Efecto requerido |
|---|---|
| Publicar un requerimiento | Crear `PublicacionRequerimiento` e `InvitacionProveedor` por cada proveedor elegido, y generar `Notificacion` tipo `NUEVA_OPORTUNIDAD`. |
| Cambiar el plazo | Actualizar `fechaLimite` y notificar `PLAZO_MODIFICADO`. |
| Evaluar cotizaciones | Pasar `Recibida` a `En Evaluación`. |
| Adjudicar | Poner `Aceptada` y `Rechazada` en las cotizaciones, `motivoDecision`, publicación `Adjudicada`, generar `OrdenCompra` y notificar `ADJUDICADA` / `NO_ADJUDICADA`. |
| Cancelar | Publicación `Cancelada` y notificar `CANCELADA`. |

Si esos módulos aún no existen, el Sprint 4 incluye endpoints mínimos de Compras (`/api/compras/publicaciones`) para poder probar de punta a punta.

### 6.5 Seguridad

- **Aislamiento entre proveedores** (lo más crítico): toda consulta incluye `idProveedor` del token; las pruebas deben intentar leer datos ajenos y esperar 404.
- Autorización en servidor por permiso (`portal.*`); rol `Proveedor` separado de los roles municipales.
- Las credenciales las genera Compras (tesis) y se envían al correo del proveedor: usar **contraseña temporal con cambio obligatorio en el primer ingreso**, bloqueo tras intentos fallidos (`Usuario.estado = 'Bloqueado'`) y límite de peticiones.
- Archivos: validar tipo real (no solo extensión), renombrar al guardar, no servirlos desde carpeta pública, descargar mediante endpoint autorizado.
- Consultas parametrizadas; escape de texto libre (motivos, observaciones) al mostrarlo.
- HTTPS obligatorio en Azure.

### 6.6 Notificaciones y tareas programadas

| Tipo | Disparador | Canal |
|---|---|---|
| `NUEVA_OPORTUNIDAD` | Compras publica | Portal + correo (`Persona.correo`) |
| `RECORDATORIO_CIERRE` | 24 h antes de `fechaLimite` si no ha enviado cotización | Portal + correo |
| `COTIZACION_RECIBIDA` | Proveedor envía | Portal (constancia) |
| `PLAZO_MODIFICADO` / `CANCELADA` | Compras cambia o cancela | Portal + correo |
| `ADJUDICADA` / `NO_ADJUDICADA` | Compras adjudica | Portal + correo |

La restricción `UNIQUE` de `Notificacion` evita duplicados si la tarea corre dos veces. Un job (`node-cron`) cada 5-15 minutos cierra las publicaciones vencidas (`Abierta` → `Cerrada`) y genera recordatorios.

---

## 7. Diseño de la interfaz

- **Encabezado de resumen:** cuatro tarjetas (Abiertas, Por vencer, En evaluación, Adjudicadas).
- **Pestañas:** Abiertas, Mis cotizaciones, Adjudicadas, Historial.
- **Lista:** tarjetas o filas con dependencia, resumen de insumos, prioridad, fecha límite con **cuenta regresiva** y estado (color **y** texto).
- **Detalle:** requerimiento, tabla de insumos (nombre, unidad, cantidad, observaciones), condiciones, lugar de entrega, fecha límite.
- **Formulario de cotización:** tabla de líneas con precio unitario editable, subtotales y total calculados en pantalla (el servidor los recalcula), condiciones de pago, tiempo de entrega, validez, adjuntos, **guardado automático de borrador**, y confirmación antes de enviar.
- **Resultado:** al adjudicar o no adjudicar, mostrar el motivo y, si es adjudicada, un enlace a la orden en la sección de ventas y pagos.
- **Conectividad inestable** (debilidad señalada en la tesis): mensajes claros de reintento, no perder lo escrito, mostrar "Guardado hace X minutos".
- **Responsivo** (CSS Grid y Flexbox, según el DERCAS): muchos proveedores usarán teléfono.
- **Accesibilidad básica:** contraste, etiquetas en campos, atributos ARIA.
- Montos en quetzales (Q), fechas `dd/mm/aaaa hh:mm`, zona `America/Guatemala`.

---

## 8. Ejemplos de consultas y lógica

### 8.1 Listado de oportunidades del proveedor

```sql
SELECT idPublicacion, nombreDependencia, prioridad, fechaPublicacion, fechaLimite,
       estadoOportunidad, montoTotal
FROM vw_portal_oportunidades
WHERE idProveedor = $1
  AND ($2::text IS NULL OR estadoOportunidad = $2)
  AND ($3::timestamptz IS NULL OR fechaPublicacion >= $3)
ORDER BY (estadoOportunidad IN ('Nueva','Abierta')) DESC, fechaLimite ASC
LIMIT $4 OFFSET $5;
```

### 8.2 Detalle: líneas a cotizar (solo si el proveedor fue invitado)

```sql
SELECT ds.idDetalleSolicitud, i.idInsumo, i.nombreInsumo, i.unidadMedida,
       ds.cantidadSolicitada, ds.observaciones
FROM InvitacionProveedor inv
JOIN PublicacionRequerimiento p ON p.idPublicacion = inv.idPublicacion
JOIN DetalleSolicitud ds        ON ds.idSolicitud = p.idSolicitud
JOIN Insumo i                   ON i.idInsumo = ds.idInsumo
WHERE inv.idPublicacion = $1 AND inv.idProveedor = $2;   -- 0 filas => responder 404
```

### 8.3 Envío de la cotización (transacción)

```sql
BEGIN;

-- 1) Bloquear y validar la publicación y la invitación
SELECT p.estado, p.fechaLimite, inv.estado AS estadoInv
FROM PublicacionRequerimiento p
JOIN InvitacionProveedor inv ON inv.idPublicacion = p.idPublicacion AND inv.idProveedor = $2
WHERE p.idPublicacion = $1
FOR UPDATE OF inv;
-- Rechazar si p.estado <> 'Abierta' (409), p.fechaLimite <= now() (410) o inv.estado = 'Declinó' (409)

-- 2) Recalcular en servidor y guardar
UPDATE DetalleCotizacion SET subtotal = cantidadCotizada * precioUnitario
 WHERE idCotizacion = $3;

UPDATE Cotizacion
   SET montoTotal = (SELECT SUM(subtotal) FROM DetalleCotizacion WHERE idCotizacion = $3),
       estado = 'Recibida', fechaEnvio = now()
 WHERE idCotizacion = $3 AND idProveedor = $2 AND estado = 'Borrador';
-- Si no afecta ninguna fila => 409 (ya enviada)

INSERT INTO BitacoraAccion (idUsuario, accion, modulo, detalle)
VALUES ($4, 'ENVIA_COTIZACION', 'Portal', $5);

COMMIT;
```

### 8.4 Resumen para las tarjetas

```sql
SELECT
  COUNT(*) FILTER (WHERE estadoOportunidad IN ('Nueva','Abierta'))                         AS abiertas,
  COUNT(*) FILTER (WHERE estadoOportunidad IN ('Nueva','Abierta')
                     AND fechaLimite < now() + interval '48 hours')                         AS por_vencer,
  COUNT(*) FILTER (WHERE estadoOportunidad = 'Cotizada')                                    AS en_evaluacion,
  COUNT(*) FILTER (WHERE estadoOportunidad = 'Adjudicada'
                     AND fechaPublicacion >= date_trunc('year', now()))                     AS adjudicadas_anio
FROM vw_portal_oportunidades
WHERE idProveedor = $1;
```

---

## 9. Plan por fases (Scrum)

Estimación para un solo desarrollador, sprints de **2 semanas**.

### Sprint 0 — Preparación (1 semana)

- [ ] Confirmar la definición de "oportunidad" y resolver las preguntas críticas de la sección 12.
- [ ] Resolver las inconsistencias de la sección 2.2.
- [ ] Script PostgreSQL del modelo base más las tablas y cambios de la sección 3.4.
- [ ] Rol `Proveedor` y permisos `portal.*`.
- [ ] Datos de prueba: 4 a 5 proveedores (uno suspendido), publicaciones en todos los estados, cotizaciones de varios proveedores sobre la misma solicitud (para probar aislamiento).
- [ ] `docker-compose` (web, API, PostgreSQL), ramas en GitHub.

### Sprint 1 — Acceso y consulta (2 semanas)

- [ ] Autenticación del proveedor y middleware que resuelve `idProveedor` desde el token.
- [ ] Vista `vw_portal_oportunidades` e índices.
- [ ] Endpoints `resumen`, listado y detalle (con marca de "visto").
- [ ] Pantallas: lista con pestañas y filtros, tarjetas de resumen, detalle de solo lectura, `EstadoBadge` y `CuentaRegresiva`.

### Sprint 2 — Cotización (2 semanas)

- [ ] Borrador con guardado automático, edición y validaciones (RN-04 a RN-08).
- [ ] Cálculo de totales en servidor; envío en transacción; constancia.
- [ ] Retirar y declinar.
- [ ] `FormularioCotizacion` y `TablaItemsCotizar` con manejo de errores 409 y 410.
- [ ] Pruebas de concurrencia (doble envío) y de plazo.

### Sprint 3 — Adjuntos y notificaciones (2 semanas)

- [ ] Carga y descarga de adjuntos con validación de tipo, tamaño y hash; almacenamiento en Azure Blob o volumen.
- [ ] Notificaciones dentro del portal (campana) y por correo.
- [ ] Jobs: recordatorio 24 h antes y cierre automático de publicaciones vencidas.

### Sprint 4 — Resultados e integración (2 semanas)

- [ ] Estados `Adjudicada` y `No adjudicada` con motivo; enlace a la orden de compra.
- [ ] Pestaña Historial y filtros por fechas.
- [ ] Endpoints mínimos de Compras para publicar, invitar, evaluar y adjudicar (si el módulo de Proformas aún no los tiene).
- [ ] Registro en `BitacoraAccion` de todas las acciones.
- [ ] Prueba de punta a punta: publicar → notificar → cotizar → adjudicar → orden.

### Sprint 5 — Pruebas, despliegue y capacitación (1 a 2 semanas)

- [ ] Colección Postman completa, con pruebas de aislamiento, plazos, permisos y archivos.
- [ ] Pruebas de usabilidad con proveedores reales o de prueba (en teléfono y computadora).
- [ ] Revisión de seguridad (OWASP básico).
- [ ] Imagen Docker final y despliegue en Azure.
- [ ] Manual breve para proveedores y sesión de orientación.

### Resumen de tiempos

| Sprint | Enfoque | Duración |
|---|---|---|
| 0 | Preparación y modelo de datos | 1 semana |
| 1 | Acceso y consulta | 2 semanas |
| 2 | Cotización | 2 semanas |
| 3 | Adjuntos y notificaciones | 2 semanas |
| 4 | Resultados e integración | 2 semanas |
| 5 | Pruebas, despliegue, capacitación | 1–2 semanas |
| **Total** | | **≈ 10–11 semanas** |

---

## 10. Rendimiento e índices

```sql
CREATE INDEX idx_inv_proveedor        ON InvitacionProveedor (idProveedor, idPublicacion);
CREATE INDEX idx_pub_estado_limite    ON PublicacionRequerimiento (estado, fechaLimite);
CREATE INDEX idx_pub_solicitud        ON PublicacionRequerimiento (idSolicitud);
CREATE INDEX idx_cotiz_pub_prov       ON Cotizacion (idPublicacion, idProveedor);
CREATE INDEX idx_detcotiz_cotiz       ON DetalleCotizacion (idCotizacion);
CREATE INDEX idx_doc_cotiz            ON DocumentoCotizacion (idCotizacion);
CREATE INDEX idx_notif_usuario_leida  ON Notificacion (idUsuario, leida, fechaCreacion DESC);
```

- Paginación en servidor en la lista y en notificaciones.
- Archivos fuera de la base de datos (solo ruta y hash).
- Manejar `NUMERIC` sin perder precisión en Node.js (texto o librería decimal).

---

## 11. Pruebas, criterios de aceptación y riesgos

### 11.1 Pruebas

| Tipo | Qué se prueba |
|---|---|
| **Aislamiento** | El proveedor A no puede ver, editar ni descargar nada del proveedor B (404). Probar con IDs manipulados. |
| Reglas de plazo | Envío 1 segundo antes y 1 segundo después de `fechaLimite`; cambio de plazo; zona horaria. |
| Estados | Cada estado de la sección 4 con datos de prueba. |
| Concurrencia | Doble clic en "Enviar", dos pestañas, envío y retiro simultáneos. |
| Cálculos | Totales y redondeo; precios cero o negativos; cantidades alteradas desde el cliente. |
| Archivos | Tipo falso con extensión PDF, tamaño excedido, nombre con caracteres especiales, descarga ajena. |
| Seguridad | Proveedor suspendido, usuario bloqueado, token vencido, intentos de inyección. |
| Notificaciones | Una sola por evento; recordatorio no duplicado. |
| Usabilidad | Un proveedor completa su primera cotización sin ayuda. |

### 11.2 Criterios de aceptación

- [ ] Un proveedor invitado ve la oportunidad, la abre y envía una cotización con adjuntos antes del plazo.
- [ ] Después del plazo no puede crear, editar ni retirar su cotización.
- [ ] Ningún proveedor accede a datos de otro.
- [ ] Los totales calculados por el servidor coinciden con los del cuadro comparativo de Compras.
- [ ] El proveedor recibe notificaciones de nueva oportunidad, recordatorio y resultado.
- [ ] El proveedor ve si fue adjudicado o no, con el motivo, y llega a la orden de compra si fue adjudicado.
- [ ] Toda acción queda en `BitacoraAccion`.
- [ ] La colección Postman pasa completa.
- [ ] Proveedores de prueba completaron el flujo en móvil y escritorio.

### 11.3 Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| El modelo de datos actual no soporta el módulo (sin publicación, invitación ni vínculo usuario-proveedor). | Alta | Aprobar las tablas de la sección 3.4 en el Sprint 0. |
| El nombre "Mis oportunidades" se interpreta distinto por la municipalidad. | Media | Confirmar la definición (sección 1.1) antes de programar. |
| Filtración de datos entre proveedores. | Baja, impacto muy alto | Alcance por token en toda consulta; pruebas dedicadas; revisión de código. |
| Conectividad inestable de proveedores y de la municipalidad. | Alta | Borrador automático, mensajes de reintento, aviso de plazo con margen. |
| Discusiones por el plazo (reloj del servidor, zona horaria). | Media | Hora del servidor como única referencia; mostrar la hora límite exacta y la zona. |
| Archivos maliciosos. | Media | Validación de tipo y tamaño, descarga controlada, analizar con antivirus si el presupuesto lo permite. |
| Correos que no llegan (spam o rebote). | Media | SMTP institucional o servicio transaccional; las notificaciones del portal son la fuente principal. |
| Dependencia de los módulos de Compras y Proformas. | Media | Contrato mínimo (6.4) y endpoints temporales en el Sprint 4. |
| Diferencias entre el ER del DERCAS y el de la tesis. | Media | Usar el diccionario del DERCAS como fuente única y documentar los cambios. |

---

## 12. Preguntas abiertas para el usuario / la municipalidad

1. **¿"Mis oportunidades" son los requerimientos a los que el proveedor fue invitado a cotizar** (como interpreta este plan), o un catálogo abierto a cualquier proveedor registrado?
2. ¿El proveedor puede **autoinscribirse** en una oportunidad abierta, o solo participa si Compras lo invita?
3. **Confidencialidad:** ¿Compras puede ver las cotizaciones antes de `fechaLimite` (sobre sellado vs. abierto)? ¿Y los proveedores no adjudicados pueden ver el precio ganador? Este plan oculta todo dato de la competencia.
4. ¿Se debe cotizar **todas** las líneas o se permiten cotizaciones parciales? ¿Se aceptan cantidades distintas a las solicitadas?
5. ¿Los precios **incluyen IVA**? El modelo no guarda impuestos por separado.
6. ¿Una empresa tendrá **uno o varios usuarios** en el portal?
7. ¿Compras puede **prorrogar el plazo** y reabrir una publicación (segunda ronda)?
8. ¿Qué tipos de archivo y tamaño máximo se aceptan para proformas?
9. ¿Existe un servidor de **correo institucional** para enviar notificaciones y credenciales?
10. ¿Se mostrará al proveedor la **dependencia solicitante** y la prioridad, o solo los insumos?

---

## 13. Entregables

- Script SQL: cambios de modelo, tablas nuevas, vista, índices y datos de prueba.
- API del portal (Node.js): oportunidades, cotizaciones, adjuntos, notificaciones y tareas programadas.
- Interfaz React: lista, detalle, formulario de cotización y notificaciones.
- Endpoints mínimos de Compras para pruebas de punta a punta (si hace falta).
- Colección Postman con pruebas de aislamiento y plazos.
- Imágenes Docker y guía de despliegue en Azure.
- Manual para proveedores y acta de pruebas.
