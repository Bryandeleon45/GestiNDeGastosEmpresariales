# Plan de Desarrollo — Módulo de Dashboard (Panel de Control)

**Proyecto:** Sistema Web para la Gestión de la Cadena de Suministro de Proveedores — Municipalidad de Panajachel
**Fuentes:** DERCAS (versión final, 27/07/2026) y tesis de graduación
**Módulo:** Dashboard — centro de monitoreo principal de la administración municipal

---

## 1. Resumen y alcance

### 1.1 Qué dicen los documentos sobre el módulo

- **Módulo de Dashboard (DERCAS y tesis):** funciona como el centro de monitoreo principal para la administración municipal. Muestra métricas clave en tiempo real: **total de solicitudes, órdenes pendientes, entregas parciales y facturas por pagar**, además de **gráficos de gastos por departamento** y **alertas automáticas de stock bajo** en bodega.
- **Alertas de stock mínimo:** el DERCAS (proceso crítico 5) y la tesis (variable independiente) las consideran un indicador del proyecto; las normas de auditoría gubernamental se citan como respaldo de este sistema de alertas.
- **Necesidad de la municipalidad:** saber en tiempo real qué insumos hay en bodega y cómo va el presupuesto de cada oficina; evitar compras imprevistas y desabastecimiento.
- **Usuarios clave:** Alcalde, Jefe Financiero / DAFIM, Encargado de Compras, Encargada de Inventario y personal de bodega.

### 1.2 Dentro del alcance

- Tarjetas de indicadores (KPI), gráficos, panel de alertas y actividad reciente.
- Filtros de período y dependencia.
- Vistas según rol y permisos (cada usuario ve solo lo que le corresponde).
- Actualización automática periódica y botón de refrescar.
- Enlaces "ver detalle" hacia los reportes del módulo de Reportes.

### 1.3 Fuera del alcance (Delimitaciones del DERCAS)

- Sin integración con SICOIN ni Guatecompras: los montos son los registrados en el sistema, no cifras contables oficiales.
- Sin pagos en línea ni contabilidad general.
- Sin portal en tiempo real para la Contraloría (CGC).
- Sin GPS ni telemetría de transporte.
- Sin migración de datos históricos en papel: el dashboard empieza "vacío" y se llena con el uso.
- Sin aplicaciones móviles nativas: la interfaz será web y responsiva.

> **"Tiempo real" en este plan** significa que los datos reflejan el último registro guardado en la base de datos y se refrescan cada pocos segundos o minutos. No se propone ninguna tecnología de tiempo real estricto, porque la municipalidad tiene cortes de internet y equipos antiguos (limitaciones del DERCAS).

---

## 2. Tecnologías (según el DERCAS)

| Capa | Tecnología del DERCAS | Uso en el Dashboard |
|---|---|---|
| Front-end | React, HTML5, CSS3 (Flexbox y Grid) | Tablero responsivo, tarjetas y gráficos; consume JSON de la API. |
| Back-end | Node.js | API REST con agregaciones, permisos por rol y caché corta. |
| Base de datos | PostgreSQL | Consultas de agregación, vistas, índices. |
| Infraestructura | Microsoft Azure, Docker | Contenedores para web, API y BD; despliegue en la nube. |
| Control de versiones | Git, GitHub | Ramas `feature/dashboard-*`. |
| Pruebas de API | Postman | Colección de endpoints del dashboard. |
| Metodología | Scrum / PMBOK, patrón MVC | Entregas por sprint. |

### 2.1 Librerías propuestas (no vienen en los documentos)

| Necesidad | Opción sugerida |
|---|---|
| Framework HTTP en Node.js | Express |
| Acceso a PostgreSQL | `pg` con consultas parametrizadas (o Knex) |
| Caché en memoria (TTL corto) | `node-cache` (evita añadir Redis, que no está en el stack) |
| Gráficos | Recharts |
| Consulta y refresco de datos | TanStack Query (`refetchInterval`) |
| Validación de filtros | Zod o Joi |

### 2.2 Inconsistencias del DERCAS que afectan a este módulo

1. **Back-end:** la sección de stack indica **Node.js**, pero las revisiones documentales mencionan **.NET Core**. Este plan sigue Node.js.
2. **Sintaxis SQL:** el diccionario de datos usa sintaxis de SQL Server (`IDENTITY`, `GETDATE()`, `datetime`), pero el motor declarado es **PostgreSQL**. Equivalencias: `GENERATED ALWAYS AS IDENTITY`, `now()`, `TIMESTAMPTZ`, `NUMERIC(12,2)`.
3. **Diagramas ER distintos:** el DERCAS describe 18 tablas y la tesis habla de otras entidades (`BITACORA_ACCESO`, `REQUISICION`, `BODEGA`, `KARDEX`). Este plan usa el **diccionario de datos del DERCAS** como modelo base. Los diagramas ER de ambos documentos son imágenes y no se pudieron leer como texto.

---

## 3. Modelo entidad-relación aplicado al Dashboard

### 3.1 Tablas y su uso

| Tabla | Indicadores que alimenta |
|---|---|
| `SolicitudCompra` (`estado`, `prioridad`, `fechaSolicitud`, `idDependencia`) | Total y estado de solicitudes, urgentes, antigüedad. |
| `OrdenCompra` (`estado`, `montoTotal`, `fechaEmision`, `fechaEntregaEstimada`, `idSolicitud`, `idProveedor`) | Órdenes pendientes, gasto, entregas atrasadas. |
| `DetalleOrdenCompra` | Cantidades compradas (para detectar entregas parciales). |
| `RecepcionInsumo`, `DetalleRecepcion` | Entregas parciales y con novedades; cantidades aceptadas. |
| `Insumo` (`stockActual`, `stockMinimo`), `CategoriaInsumo` | Alertas de stock bajo, existencias. |
| `MovimientoInventario` | Actividad reciente de bodega. |
| `ValeSalida`, `DetalleValeSalida` | Vales pendientes de autorización, insumos más consumidos. |
| `Cotizacion` (`estado`, `fechaValidez`) | Proformas por evaluar o por vencer. |
| `Proveedor` | Proveedores activos/suspendidos, top por monto. |
| `Dependencia` (`idResponsable`) | Agrupación del gasto y acotación de vista por responsable. |
| `Usuario`, `Persona`, `Rol`, `Permiso`, `Rol_Permiso` | Autorización de cada widget y nombres en actividad reciente. |

### 3.2 Relaciones clave para las agregaciones

```
Dependencia 1─N SolicitudCompra 1─N OrdenCompra N─1 Proveedor
OrdenCompra 1─N DetalleOrdenCompra N─1 Insumo
OrdenCompra 1─N RecepcionInsumo 1─N DetalleRecepcion
SolicitudCompra 1─N Cotizacion N─1 Proveedor
Dependencia 1─N ValeSalida 1─N DetalleValeSalida N─1 Insumo
Insumo 1─N MovimientoInventario N─1 Usuario N─1 Persona
```

El **gasto por dependencia** no está en una sola tabla: se obtiene por la cadena `OrdenCompra → SolicitudCompra → Dependencia`.

### 3.3 Brechas del modelo que afectan al Dashboard

| Brecha | Impacto | Propuesta |
|---|---|---|
| No existen tablas de **factura** ni **orden de pago** (el DERCAS promete "facturas por pagar"). | El KPI de facturas por pagar no se puede calcular. | Fase 1: mostrar la tarjeta como "No disponible" o ocultarla. Fase 2: activarla cuando se cree el módulo de Facturación y Pagos (`Factura`, `OrdenPago`). |
| No existe **presupuesto por dependencia** (el DERCAS habla de presupuesto asignado). | No se puede graficar presupuesto vs. gasto ni el % ejecutado. | Fase 1: solo gasto comprometido por dependencia. Fase 2: tabla `PresupuestoDependencia` (dependencia, período, monto asignado). |
| No existe **período fiscal activo** (lo menciona el módulo de Configuración). | No hay un período por defecto para filtrar. | Fase 1: año calendario en curso. Fase 2: tabla `Configuracion` / `PeriodoFiscal`. |
| El gasto solo tiene `OrdenCompra.montoTotal`. | "Gasto" es en realidad **compra comprometida**, no pago efectuado. | Rotularlo así en el gráfico ("Compras por dependencia") para no inducir a error. |
| `ValeSalida` y `MovimientoInventario` no guardan costo. | No se puede mostrar el valor del consumo, solo cantidades. | Valorizar con precio promedio ponderado de `DetalleOrdenCompra` (decisión compartida con el módulo de Reportes). |
| No hay registro de alertas **leídas o descartadas**. | Las alertas se recalculan cada vez; no hay "marcar como vista". | Opcional: tabla `AlertaUsuario` (ver 3.4). |

### 3.4 Tablas nuevas opcionales

```sql
-- Opcional: estado de lectura de alertas por usuario
CREATE TABLE AlertaUsuario (
  idAlertaUsuario INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  idUsuario       INT NOT NULL REFERENCES Usuario(idUsuario),
  tipoAlerta      VARCHAR(40) NOT NULL,   -- 'STOCK_BAJO', 'ORDEN_ATRASADA', 'PROFORMA_POR_VENCER', ...
  referenciaId    INT NOT NULL,           -- idInsumo, idOrdenCompra, idCotizacion...
  fechaLectura    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idUsuario, tipoAlerta, referenciaId)
);

-- Permisos del módulo (se insertan en la tabla Permiso existente)
-- dashboard.ver, dashboard.compras, dashboard.inventario, dashboard.financiero
```

---

## 4. Catálogo de widgets

Cada widget lleva un código (W-xx) para el backlog, las pruebas y la aceptación. La columna "Reporte" indica a qué reporte del plan de Reportes enlaza el "ver detalle".

### 4.1 Tarjetas de indicadores (KPI)

| Código | Indicador | Cálculo | Tablas | Reporte |
|---|---|---|---|---|
| W-01 | **Total de solicitudes** (período) y desglose por estado | `COUNT` por `estado` | `SolicitudCompra` | RPT-05 |
| W-02 | **Solicitudes pendientes / urgentes** | `estado = 'Pendiente'`; `prioridad IN ('Alta','Urgente')` | `SolicitudCompra` | RPT-05 |
| W-03 | **Órdenes pendientes** | `estado IN ('Pendiente','Aprobada','Enviada')` | `OrdenCompra` | RPT-08 |
| W-04 | **Entregas parciales / con novedades** | Órdenes con lo aceptado menor a lo comprado (ver 6.2) y recepciones `Parcial` o `Con Novedades` | `OrdenCompra`, `DetalleOrdenCompra`, `RecepcionInsumo`, `DetalleRecepcion` | RPT-09 |
| W-05 | **Facturas por pagar** | Fase 2 (requiere `Factura`) | pendiente | — |
| W-06 | **Insumos bajo stock mínimo** | `stockActual <= stockMinimo` | `Insumo` | RPT-02 |
| W-07 | **Vales de salida pendientes de autorización** | `estado = 'Pendiente'` | `ValeSalida` | RPT-04 |
| W-08 | **Proveedores activos / suspendidos** | `COUNT` por `estado` | `Proveedor` | RPT-06 |

### 4.2 Gráficos

| Código | Gráfico | Tipo | Tablas | Reporte |
|---|---|---|---|---|
| W-09 | **Compras por dependencia** (el "gasto por departamento" del DERCAS) | Barras horizontales | `OrdenCompra`, `SolicitudCompra`, `Dependencia` | RPT-11 |
| W-10 | **Compras por mes** | Líneas | `OrdenCompra` | RPT-11 |
| W-11 | **Solicitudes por estado** | Circular / dona | `SolicitudCompra` | RPT-05 |
| W-12 | **Top 5 insumos más consumidos** | Barras | `DetalleValeSalida`, `ValeSalida`, `Insumo` | RPT-04 |
| W-13 | **Top 5 proveedores por monto** | Barras | `OrdenCompra`, `Proveedor` | RPT-06 |

### 4.3 Alertas y actividad

| Código | Elemento | Regla | Tablas |
|---|---|---|---|
| W-14 | **Alerta de stock bajo** (listado con faltante) | `stockActual <= stockMinimo` | `Insumo` |
| W-15 | **Órdenes con entrega atrasada** | `fechaEntregaEstimada < CURRENT_DATE` y estado `Aprobada` o `Enviada` | `OrdenCompra` |
| W-16 | **Proformas por vencer** | `fechaValidez` en los próximos 3 días y estado `Recibida` o `En Evaluación` | `Cotizacion` |
| W-17 | **Solicitudes sin atender** | `estado = 'Pendiente'` con más de N días (N configurable) | `SolicitudCompra` |
| W-18 | **Actividad reciente de bodega** (últimos 10 movimientos) | orden descendente por `fechaMovimiento` | `MovimientoInventario`, `Insumo`, `Usuario`, `Persona` |

### 4.4 Vistas por rol (propuesta; validar con la municipalidad)

| Rol | Widgets principales |
|---|---|
| Alcalde / Jefe Financiero (DAFIM) | W-01, W-03, W-09, W-10, W-13, W-15 (y W-05 en fase 2) |
| Encargado de Compras | W-01, W-02, W-03, W-11, W-16, W-17 |
| Encargada de Inventario / Bodega | W-04, W-06, W-07, W-12, W-14, W-18 |
| Responsable de dependencia | W-01, W-02, W-11, W-12 (acotados a **su** dependencia vía `Dependencia.idResponsable`) |
| Administrador | Todos |

### 4.5 Priorización (MoSCoW)

- **Must:** W-01, W-02, W-03, W-04, W-06, W-09, W-14 (son los que nombra el DERCAS).
- **Should:** W-07, W-10, W-11, W-12, W-15, W-17, W-18.
- **Could:** W-08, W-13, W-16.
- **Fase 2:** W-05 (facturas por pagar) y presupuesto vs. gasto.

---

## 5. Arquitectura del módulo

```
React (SPA)  ──HTTPS/JSON──►  API Node.js (MVC)  ──SQL──►  PostgreSQL
 /dashboard                   /api/dashboard                 consultas agregadas
 tarjetas, gráficos,          permisos + alcance,            índices por estado
 alertas, polling             caché TTL corto                y fechas
```

### 5.1 Estructura de carpetas sugerida (back-end)

```
src/modules/dashboard/
├── dashboard.routes.js        # rutas y middleware de permisos
├── dashboard.controller.js    # lee filtros, responde JSON
├── dashboard.service.js       # arma cada widget, aplica alcance por rol, caché
├── dashboard.repository.js    # consultas SQL parametrizadas
├── widgets.js                 # catálogo: código, permiso requerido, consulta, TTL de caché
└── validadores/               # filtros: fechaInicio, fechaFin, idDependencia
```

Igual que en Reportes, un **catálogo declarativo de widgets** permite agregar o quitar indicadores sin tocar controladores ni rutas.

### 5.2 Estructura de carpetas sugerida (front-end)

```
src/modules/dashboard/
├── pages/ DashboardPage.jsx
├── components/ KpiCard.jsx, ChartCard.jsx, PanelAlertas.jsx,
│               ActividadReciente.jsx, FiltroPeriodo.jsx, EstadoWidget.jsx
├── hooks/ useWidget.js            # polling y manejo de error por widget
└── services/ dashboardApi.js
```

### 5.3 Contrato de la API

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/dashboard/resumen` | Todas las tarjetas KPI visibles para el rol, en una sola llamada. |
| GET | `/api/dashboard/graficos/compras-por-dependencia` | W-09. |
| GET | `/api/dashboard/graficos/compras-por-mes` | W-10. |
| GET | `/api/dashboard/graficos/solicitudes-por-estado` | W-11. |
| GET | `/api/dashboard/top/insumos-consumo` | W-12. |
| GET | `/api/dashboard/top/proveedores` | W-13. |
| GET | `/api/dashboard/alertas` | W-14 a W-17, con `tipo`, `severidad`, `mensaje` y `enlace`. |
| GET | `/api/dashboard/actividad-reciente` | W-18. |

**Filtros:** `fechaInicio`, `fechaFin`, `idDependencia`. Si no se envían, se usa el año en curso.

**Respuesta de `/resumen`:**

```json
{
  "generadoEn": "2026-10-05T10:00:00-06:00",
  "periodo": { "fechaInicio": "2026-01-01", "fechaFin": "2026-12-31" },
  "kpis": {
    "totalSolicitudes": { "valor": 0, "porEstado": { "Pendiente": 0, "Aprobada": 0 } },
    "solicitudesPendientes": { "valor": 0, "urgentes": 0 },
    "ordenesPendientes": { "valor": 0 },
    "entregasParciales": { "valor": 0 },
    "insumosBajoMinimo": { "valor": 0 },
    "facturasPorPagar": { "disponible": false }
  }
}
```

La API devuelve **solo los widgets permitidos** al rol; los demás no aparecen en la respuesta.

### 5.4 Seguridad y alcance de datos

- Permisos propuestos: `dashboard.ver`, `dashboard.compras`, `dashboard.inventario`, `dashboard.financiero`, asignados en `Rol_Permiso`.
- Validación **en el servidor**; ocultar una tarjeta en React no es seguridad.
- Para un responsable de dependencia, la API añade el filtro por su dependencia, ignorando el que envíe el cliente.
- Montos y gráficos de compras solo para quien tenga `dashboard.financiero`.
- Consultas parametrizadas y usuario de base de datos de solo lectura.

### 5.5 Actualización de datos y caché

| Estrategia | Decisión propuesta |
|---|---|
| Refresco en pantalla | **Polling** cada 60 s para KPI y alertas (30 s si se prefiere); botón "Actualizar" manual; pausar cuando la pestaña no está visible. |
| Caché en servidor | TTL de 30 a 60 s en memoria por combinación `rol + filtros`. Se invalida al registrarse una recepción, un vale o una orden (opcional). |
| Tiempo real estricto | No se usa WebSocket en la primera versión (red inestable, equipos antiguos). Se puede evaluar SSE solo para alertas. |
| Falla de un widget | Cada widget se carga de forma independiente (`Promise.allSettled`): un error muestra "No se pudo cargar. Reintentar" sin romper el tablero. |
| Conexión caída | Mantener los últimos datos mostrados y avisar "Última actualización: hh:mm". |

---

## 6. Ejemplos de consultas (PostgreSQL)

Son ilustrativas; ajústalas a los nombres finales de tu script. Si las tablas se crearon sin comillas, PostgreSQL las guarda en minúsculas y estas consultas funcionan igual.

### 6.1 KPI resumidos en una sola consulta

```sql
SELECT
  (SELECT COUNT(*) FROM SolicitudCompra
     WHERE fechaSolicitud >= $1 AND fechaSolicitud < $2)                 AS total_solicitudes,
  (SELECT COUNT(*) FROM SolicitudCompra WHERE estado = 'Pendiente')      AS solicitudes_pendientes,
  (SELECT COUNT(*) FROM SolicitudCompra
     WHERE estado = 'Pendiente' AND prioridad IN ('Alta','Urgente'))     AS solicitudes_urgentes,
  (SELECT COUNT(*) FROM OrdenCompra
     WHERE estado IN ('Pendiente','Aprobada','Enviada'))                 AS ordenes_pendientes,
  (SELECT COUNT(*) FROM Insumo
     WHERE stockMinimo IS NOT NULL AND stockActual <= stockMinimo)       AS insumos_bajo_minimo,
  (SELECT COUNT(*) FROM ValeSalida WHERE estado = 'Pendiente')           AS vales_pendientes;
```

Para acotar a una dependencia, agrega `AND idDependencia = $3` a las subconsultas de solicitudes y vales. Para las órdenes, hay que pasar por `SolicitudCompra` (ver 6.3).

### 6.2 W-04 Entregas parciales

```sql
SELECT COUNT(*) AS entregas_parciales
FROM (
  SELECT oc.idOrdenCompra
  FROM OrdenCompra oc
  JOIN DetalleOrdenCompra d ON d.idOrdenCompra = oc.idOrdenCompra
  LEFT JOIN (
    SELECT r.idOrdenCompra, dr.idInsumo, SUM(dr.cantidadAceptada) AS aceptada
    FROM RecepcionInsumo r
    JOIN DetalleRecepcion dr ON dr.idRecepcion = r.idRecepcion
    GROUP BY r.idOrdenCompra, dr.idInsumo
  ) x ON x.idOrdenCompra = d.idOrdenCompra AND x.idInsumo = d.idInsumo
  WHERE oc.estado NOT IN ('Entregada', 'Cancelada')
  GROUP BY oc.idOrdenCompra
  HAVING SUM(COALESCE(x.aceptada, 0)) > 0
     AND SUM(COALESCE(x.aceptada, 0)) < SUM(d.cantidadComprada)
) t;
```

> Supone un insumo por línea de orden. Si una orden repite el mismo insumo en dos líneas, hay que agrupar `DetalleOrdenCompra` por insumo antes de unir.

### 6.3 W-09 Compras por dependencia

```sql
SELECT d.nombreDependencia, SUM(oc.montoTotal) AS compras
FROM OrdenCompra oc
JOIN SolicitudCompra s ON s.idSolicitud = oc.idSolicitud
JOIN Dependencia d     ON d.idDependencia = s.idDependencia
WHERE oc.estado IN ('Aprobada', 'Enviada', 'Entregada')
  AND oc.fechaEmision >= $1 AND oc.fechaEmision < $2
GROUP BY d.nombreDependencia
ORDER BY compras DESC;
```

### 6.4 W-10 Compras por mes

```sql
SELECT date_trunc('month', oc.fechaEmision) AS mes, SUM(oc.montoTotal) AS compras
FROM OrdenCompra oc
WHERE oc.estado IN ('Aprobada', 'Enviada', 'Entregada')
  AND oc.fechaEmision >= $1 AND oc.fechaEmision < $2
GROUP BY 1
ORDER BY 1;
```

### 6.5 Alertas

```sql
-- W-14 Stock bajo
SELECT i.idInsumo, i.nombreInsumo, i.unidadMedida, i.stockActual, i.stockMinimo,
       (i.stockMinimo - i.stockActual) AS faltante
FROM Insumo i
WHERE i.stockMinimo IS NOT NULL AND i.stockActual <= i.stockMinimo
ORDER BY (i.stockActual::numeric / NULLIF(i.stockMinimo, 0)) ASC
LIMIT 20;

-- W-15 Órdenes con entrega atrasada
SELECT oc.idOrdenCompra, pr.nombreEmpresa, oc.fechaEntregaEstimada,
       CURRENT_DATE - oc.fechaEntregaEstimada AS dias_atraso
FROM OrdenCompra oc
JOIN Proveedor pr ON pr.idProveedor = oc.idProveedor
WHERE oc.estado IN ('Aprobada', 'Enviada') AND oc.fechaEntregaEstimada < CURRENT_DATE
ORDER BY dias_atraso DESC;

-- W-16 Proformas por vencer
SELECT c.idCotizacion, pr.nombreEmpresa, c.fechaValidez
FROM Cotizacion c
JOIN Proveedor pr ON pr.idProveedor = c.idProveedor
WHERE c.estado IN ('Recibida', 'En Evaluación')
  AND c.fechaValidez BETWEEN CURRENT_DATE AND CURRENT_DATE + 3
ORDER BY c.fechaValidez;
```

### 6.6 W-12 Top 5 insumos más consumidos

```sql
SELECT i.nombreInsumo, i.unidadMedida, SUM(dv.cantidadSalida) AS cantidad
FROM DetalleValeSalida dv
JOIN ValeSalida v ON v.idValeSalida = dv.idValeSalida
JOIN Insumo i     ON i.idInsumo = dv.idInsumo
WHERE v.estado = 'Entregado'
  AND v.fechaSalida >= $1 AND v.fechaSalida < $2
GROUP BY i.nombreInsumo, i.unidadMedida
ORDER BY cantidad DESC
LIMIT 5;
```

---

## 7. Diseño de la interfaz

- **Orden de lectura:** fila de tarjetas KPI → gráficos → panel de alertas y actividad reciente. Las alertas críticas (stock bajo, entregas atrasadas) deben verse sin hacer scroll en pantallas de escritorio.
- **Diseño responsivo** con CSS Grid y Flexbox (según el DERCAS): 4 columnas en escritorio, 2 en tableta, 1 en móvil.
- **Semáforo de severidad** con color **y** texto o ícono (no solo color): crítico, advertencia, informativo.
- **Cada tarjeta** muestra valor, etiqueta, período y un enlace "ver detalle" al reporte correspondiente.
- **Estados vacíos claros:** "Sin datos en este período", útil en los primeros meses sin datos históricos.
- **Ligero:** pocas animaciones y gráficos sencillos; los equipos de la municipalidad son antiguos y trabajan en un entorno con polvo y red inestable.
- **Formato:** montos en quetzales (Q) con dos decimales, fechas `dd/mm/aaaa`, zona horaria `America/Guatemala`.
- **Accesibilidad básica:** contraste suficiente, texto alternativo en gráficos y navegación por teclado (el DERCAS menciona atributos ARIA en HTML5).

---

## 8. Plan por fases (Scrum)

Estimación para un solo desarrollador, sprints de **2 semanas**. Si ya se ejecutó el Sprint 0 del módulo de Reportes, se reutiliza (base de datos, Docker, datos de prueba, roles y permisos).

### Sprint 0 — Preparación (1 semana, compartido con Reportes)

- [ ] Resolver las inconsistencias de la sección 2.2.
- [ ] Script PostgreSQL completo del modelo y datos de prueba realistas (incluir insumos bajo mínimo, órdenes atrasadas, recepciones parciales).
- [ ] Permisos `dashboard.*` y **matriz rol × widget** validada con la municipalidad.
- [ ] `docker-compose` (web, API, PostgreSQL) y ramas en GitHub.
- [ ] Decisiones: facturas y presupuesto (fase 1 o 2), umbral de "solicitud sin atender" (N días), valorización.

### Sprint 1 — Base y tarjetas KPI (2 semanas)

- [ ] Estructura del módulo, catálogo de widgets y middleware de permisos con alcance por dependencia.
- [ ] Endpoint `/api/dashboard/resumen` (W-01, W-02, W-03, W-04, W-06, W-07, W-08).
- [ ] `DashboardPage`, `KpiCard`, `FiltroPeriodo` y estados de carga/error por widget.
- [ ] Índices iniciales (sección 9.1).

### Sprint 2 — Alertas (2 semanas)

- [ ] Endpoint `/api/dashboard/alertas` (W-14 a W-17) con severidad y enlace.
- [ ] `PanelAlertas` y contador de alertas en la cabecera de la aplicación.
- [ ] Polling cada 60 s, pausa con la pestaña inactiva y botón de actualizar.
- [ ] (Opcional) `AlertaUsuario` para marcar como vista.

### Sprint 3 — Gráficos (2 semanas)

- [ ] Endpoints y componentes de W-09, W-10, W-11, W-12 y W-13 con Recharts.
- [ ] Filtros de período y dependencia aplicados a todo el tablero.
- [ ] Enlaces "ver detalle" hacia los reportes (si el módulo de Reportes ya está disponible).
- [ ] Caché con TTL corto.

### Sprint 4 — Roles, actividad y optimización (2 semanas)

- [ ] Vistas por rol y acotado por dependencia.
- [ ] Actividad reciente de bodega (W-18).
- [ ] Revisión de planes de ejecución (`EXPLAIN ANALYZE`) y ajuste de índices con volumen representativo.
- [ ] Si ya existe el módulo de Facturación y Pagos: activar W-05 y presupuesto vs. compras.

### Sprint 5 — Pruebas, despliegue y capacitación (1 a 2 semanas)

- [ ] Colección Postman completa (válidos, filtros inválidos, sin sesión, sin permiso, sin datos).
- [ ] Pruebas con usuarios clave (Alcalde, DAFIM, Compras, Inventario).
- [ ] Imagen Docker final y despliegue en Azure.
- [ ] Capacitación breve y prueba piloto con el personal de Almacén y Suministros.

### Resumen de tiempos

| Sprint | Enfoque | Duración |
|---|---|---|
| 0 | Preparación (compartido con Reportes) | 1 semana |
| 1 | Base y tarjetas KPI | 2 semanas |
| 2 | Alertas | 2 semanas |
| 3 | Gráficos | 2 semanas |
| 4 | Roles, actividad, optimización | 2 semanas |
| 5 | Pruebas, despliegue, capacitación | 1–2 semanas |
| **Total** | | **≈ 10–11 semanas** |

---

## 9. Rendimiento y calidad de datos

### 9.1 Índices recomendados

```sql
CREATE INDEX idx_solic_estado_fecha  ON SolicitudCompra (estado, fechaSolicitud);
CREATE INDEX idx_solic_dep           ON SolicitudCompra (idDependencia);
CREATE INDEX idx_orden_estado_fecha  ON OrdenCompra (estado, fechaEmision);
CREATE INDEX idx_orden_solicitud     ON OrdenCompra (idSolicitud);
CREATE INDEX idx_orden_entrega       ON OrdenCompra (fechaEntregaEstimada) WHERE estado IN ('Aprobada','Enviada');
CREATE INDEX idx_recep_orden         ON RecepcionInsumo (idOrdenCompra);
CREATE INDEX idx_vale_estado_fecha   ON ValeSalida (estado, fechaSalida);
CREATE INDEX idx_cotiz_estado_valid  ON Cotizacion (estado, fechaValidez);
CREATE INDEX idx_mov_fecha           ON MovimientoInventario (fechaMovimiento DESC);
CREATE INDEX idx_insumo_stock        ON Insumo (stockActual, stockMinimo);
```

### 9.2 Buenas prácticas

- Agregaciones en SQL, no en Node.js ni en React.
- Una llamada para todas las tarjetas (`/resumen`) y llamadas independientes por gráfico, para que la pantalla cargue por partes.
- Caché de 30 a 60 s; si una consulta supera el segundo con datos reales, evaluar una vista materializada.
- Manejar `NUMERIC` sin perder precisión en Node.js (devolver como texto o usar librería decimal).
- Definir con claridad los estados que cuentan: compras = `Aprobada`, `Enviada` y `Entregada`; consumo = vales `Entregado`.

### 9.3 Control de calidad de los indicadores

- El número de insumos bajo mínimo del dashboard debe ser igual al del reporte RPT-02.
- La suma de W-09 debe coincidir con el total de compras del reporte RPT-11 para el mismo período.
- El conteo de órdenes pendientes debe coincidir con el listado de RPT-08 filtrado por los mismos estados.

---

## 10. Pruebas y criterios de aceptación

### 10.1 Pruebas

| Tipo | Qué se prueba |
|---|---|
| Datos | Cada KPI contra una consulta SQL manual y contra el reporte equivalente. |
| API (Postman) | 200 con filtros válidos; 400 con fechas inválidas; 401 sin sesión; 403 sin permiso; alcance por dependencia respetado. |
| Alertas | Casos creados a propósito: stock en el mínimo exacto, bajo el mínimo, orden atrasada un día, proforma que vence hoy. |
| Interfaz | Carga parcial si un endpoint falla; estado vacío; diseño en escritorio, tableta y móvil. |
| Rendimiento | Carga inicial aceptable con un volumen de datos representativo (meta a definir con el usuario). |
| Seguridad | Un rol sin `dashboard.financiero` no recibe montos, aunque los pida directamente a la API. |
| Usabilidad | Los usuarios clave encuentran lo que necesitan sin ayuda. |

### 10.2 Criterios de aceptación del módulo

- [ ] Los widgets Must (W-01, 02, 03, 04, 06, 09 y 14) están disponibles y muestran datos correctos.
- [ ] Las alertas de stock bajo aparecen automáticamente al llegar al mínimo, sin intervención manual.
- [ ] Cada usuario ve solo los widgets y datos que su rol permite.
- [ ] Los indicadores coinciden con los reportes equivalentes.
- [ ] Un fallo de un widget no impide ver el resto del tablero.
- [ ] Los datos se actualizan solos en el intervalo definido.
- [ ] La colección Postman pasa completa.
- [ ] El personal fue capacitado y completó la prueba piloto.

---

## 11. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| "Facturas por pagar" y "presupuesto" no se pueden calcular sin tablas que hoy no existen. | Alta | Alcance por fases (3.3) y comunicarlo a la municipalidad; tarjeta oculta o "No disponible". |
| El "gasto" mostrado se interpreta como pago real. | Media | Rotular como "compras comprometidas" y documentarlo. |
| Conexión a internet inestable y equipos antiguos. | Media | Polling moderado, gráficos livianos, carga por partes, conservar último dato. |
| Consultas lentas al crecer los datos. | Media | Índices, caché de TTL corto, vistas materializadas si hace falta. |
| Discrepancias entre el dashboard y los reportes. | Media | Compartir servicios y reglas de estado entre ambos módulos; pruebas de cuadre (9.3). |
| Exceso de alertas (fatiga) o umbrales mal definidos. | Media | Umbrales configurables, severidad y límite de elementos por alerta. |
| Diferencias entre el ER del DERCAS y el de la tesis. | Media | Usar el diccionario del DERCAS como fuente única y documentar los cambios. |
| Retrasos en información de la municipalidad (Unidad de Información Pública). | Media | Solicitar con anticipación la matriz de roles y los indicadores que usan hoy. |

---

## 12. Preguntas abiertas para el usuario / la municipalidad

1. ¿El back-end será finalmente **Node.js** o **.NET Core**?
2. ¿Las **facturas por pagar** y el **presupuesto por dependencia** entran en esta entrega? Si sí, sus tablas deben diseñarse antes del Sprint 1.
3. ¿Qué estados se consideran "órdenes pendientes"? (propuesta: `Pendiente`, `Aprobada`, `Enviada`).
4. ¿Cuántos días sin atender activan la alerta de una solicitud pendiente, y con cuántos días de anticipación se avisa de una proforma por vencer?
5. ¿Qué ve cada rol? Validar la tabla 4.4, sobre todo qué pueden ver los responsables de dependencia.
6. ¿El período por defecto es el año calendario o el "período fiscal activo" del módulo de Configuración?
7. ¿Se requiere alertar por correo (usando `Persona.correo`) además de mostrar la alerta en pantalla? El plan solo cubre alertas en pantalla.

---

## 13. Entregables

- Script SQL: tablas opcionales, índices y datos de prueba.
- API del Dashboard (Node.js) con catálogo de widgets, permisos, alcance por rol y caché.
- Interfaz React del tablero (KPI, gráficos, alertas, actividad reciente).
- Colección Postman.
- Imágenes Docker y guía de despliegue en Azure.
- Manual breve de usuario y acta de capacitación / prueba piloto.
