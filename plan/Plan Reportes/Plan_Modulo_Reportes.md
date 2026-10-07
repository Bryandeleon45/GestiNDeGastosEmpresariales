# Plan de Desarrollo — Módulo de Reportes

**Proyecto:** Sistema Web para la Gestión de la Cadena de Suministro de Proveedores — Municipalidad de Panajachel
**Fuentes:** DERCAS (versión final, 27/07/2026) y tesis de graduación
**Módulo:** Reportes (análisis e informes ejecutivos con exportación a PDF y Excel)

---

## 1. Resumen y alcance

### 1.1 Qué dicen los documentos sobre el módulo

- **Módulo de Reportes (DERCAS, "Módulos del Sistema"):** genera análisis e informes ejecutivos sobre la gestión administrativa y el gasto de la institución, y permite exportar estados financieros y de compras en **PDF o Excel** para fiscalización y transparencia.
- **Proceso crítico 7, "Generación de Reportes y Estadísticas":** consolidación periódica de:
  - rotación de insumos,
  - consumos por dependencia municipal,
  - historial de compras por proveedor,
  - estado financiero general del almacén.
- **Procesos relacionados** que alimentan reportes: Control de Inventario y Kardex Digital (alertas de stock mínimo), Expediente Digital y Auditabilidad (CGC) y Gestión de Usuarios (historial de auditoría de acciones).
- **Supuesto de la tesis:** el personal solicitante necesita generar reportes de salida y de cuánto queda en stock con respuesta ágil.

### 1.2 Dentro del alcance

- Catálogo de reportes operativos, de compras, de inventario y de auditoría.
- Filtros por fecha, dependencia, proveedor, categoría, insumo y estado.
- Visualización en pantalla (tabla + gráficos) y exportación a PDF y Excel.
- Control de acceso a cada reporte según rol y permiso.

### 1.3 Fuera del alcance (Delimitaciones del DERCAS)

- Sin integración con SICOIN ni Guatecompras.
- Sin contabilidad general, planillas ni declaraciones ante la SAT. El "estado financiero" es **del almacén y las compras**, no contabilidad oficial.
- Sin emisión de FEL.
- Sin portal ni acceso directo en tiempo real para la Contraloría (CGC): el sistema **solo genera los reportes e historial** que ella necesite.
- Sin migración de datos históricos en papel: los reportes parten de los datos registrados desde la puesta en marcha.
- Sin hosting, dominios ni conectividad a cargo del estudiante.

---

## 2. Tecnologías (según el DERCAS)

| Capa | Tecnología del DERCAS | Uso en el módulo de Reportes |
|---|---|---|
| Front-end | React, HTML5, CSS3 | Pantallas de catálogo, filtros, tablas, gráficos y botones de exportación. Consume JSON de la API. |
| Back-end | Node.js | API REST que ejecuta consultas, aplica permisos y genera PDF/Excel. |
| Base de datos | PostgreSQL | Consultas de solo lectura sobre el modelo ER, vistas SQL, índices. |
| Infraestructura | Microsoft Azure, Docker | Contenedores para web, API y BD; despliegue en la nube. |
| Control de versiones | Git, GitHub | Repositorio y ramas por funcionalidad. |
| Pruebas de API | Postman | Colección de pruebas de cada endpoint de reportes. |
| Metodología | Scrum / PMBOK, patrón MVC | Entregas por sprint; separación modelo / vista / controlador. |

### 2.1 Librerías propuestas (no vienen en los documentos)

Los documentos fijan el stack, pero no las librerías. Estas son sugerencias que puedes cambiar:

| Necesidad | Opción sugerida |
|---|---|
| Framework HTTP en Node.js | Express |
| Acceso a PostgreSQL | `pg` con consultas SQL parametrizadas (o Knex) |
| Excel (.xlsx) | `exceljs` |
| PDF | `pdfmake` o `pdfkit` |
| Gráficos en React | Recharts |
| Tablas en React | TanStack Table |
| Validación de filtros | Zod o Joi |

### 2.2 Inconsistencias detectadas en el DERCAS (conviene decidirlas antes de empezar)

1. **Back-end:** la sección "Descripción del Stack Tecnológico" indica **Node.js**, pero la sección de Revisiones Documentales menciona **.NET Core**. Este plan sigue **Node.js** por ser la sección que define el stack.
2. **Sintaxis SQL:** el diccionario de datos usa sintaxis de SQL Server (`IDENTITY(1,1)`, `GETDATE()`, `datetime`), pero el motor declarado es **PostgreSQL**. Equivalencias para el script de creación:

| Diccionario de datos | PostgreSQL |
|---|---|
| `int IDENTITY(1,1)` | `INT GENERATED ALWAYS AS IDENTITY` |
| `datetime DEFAULT GETDATE()` | `TIMESTAMPTZ DEFAULT now()` |
| `decimal(12,2)` | `NUMERIC(12,2)` |
| `varchar(n)`, `text`, `date` | igual |

3. **Diagramas ER distintos:** el diccionario del DERCAS describe **18 tablas** y la tesis menciona entidades como `BITACORA_ACCESO`, `REQUISICION`, `BODEGA` y `KARDEX` (y un diagrama de clases con 33 tablas). Este plan usa el **diccionario de datos del DERCAS** como modelo base, porque es el único con columnas y tipos exactos. Los diagramas ER de ambos documentos son imágenes, así que no los pude leer como texto.

---

## 3. Modelo entidad-relación aplicado a los reportes

### 3.1 Tablas del modelo y su uso en Reportes

| Tabla | Uso en reportes |
|---|---|
| `Insumo`, `CategoriaInsumo` | Catálogo, existencias (`stockActual`, `stockMinimo`), unidad de medida. |
| `MovimientoInventario` | **Kardex** (entradas, salidas, `cantidadExistente` como saldo), rotación. |
| `ValeSalida`, `DetalleValeSalida` | Consumo por dependencia y por insumo (despachos). |
| `Dependencia` | Agrupación de consumo, solicitudes y gasto. |
| `SolicitudCompra`, `DetalleSolicitud` | Solicitudes por estado, prioridad y dependencia. |
| `Cotizacion`, `DetalleCotizacion` | Comparativo de proformas. |
| `OrdenCompra`, `DetalleOrdenCompra` | Historial de compras, montos, estado de órdenes. |
| `RecepcionInsumo`, `DetalleRecepcion` | Cumplimiento de entregas (recibido vs. aceptado). |
| `Proveedor` | Historial y desempeño por proveedor. |
| `Usuario`, `Persona` | Quién registró cada movimiento, recepción u orden. |
| `Rol`, `Permiso`, `Rol_Permiso` | Control de acceso a cada reporte. |

### 3.2 Relaciones que se usan en los `JOIN`

```
Dependencia 1─N SolicitudCompra 1─N DetalleSolicitud N─1 Insumo N─1 CategoriaInsumo
SolicitudCompra 1─N Cotizacion N─1 Proveedor
Cotizacion 1─N DetalleCotizacion N─1 Insumo
SolicitudCompra 1─N OrdenCompra N─1 Proveedor
OrdenCompra 1─N DetalleOrdenCompra N─1 Insumo
OrdenCompra 1─N RecepcionInsumo 1─N DetalleRecepcion N─1 Insumo
Dependencia 1─N ValeSalida 1─N DetalleValeSalida N─1 Insumo
Insumo 1─N MovimientoInventario N─1 Usuario N─1 Persona
Usuario N─1 Rol N─N Permiso (vía Rol_Permiso)
```

### 3.3 Brechas del modelo que afectan a los reportes

Estas brechas salen de comparar lo que prometen los módulos del DERCAS con las tablas del diccionario de datos:

| Brecha | Impacto | Propuesta |
|---|---|---|
| No hay tablas de **factura**, **orden de pago** ni **partida presupuestaria**, aunque existe el módulo "Facturación y Pagos". | El "estado financiero" solo puede basarse en `OrdenCompra.montoTotal`. No se puede reportar facturas por pagar ni ejecución presupuestaria. | Fase 1: reportar compras comprometidas con `OrdenCompra`. Fase 2: agregar `Factura`, `OrdenPago` y `PresupuestoDependencia` cuando se construya ese módulo. |
| No hay **bitácora de acciones** (la tesis sí menciona `BITACORA_ACCESO`; el DERCAS ofrece "historial de auditoría de cada acción"). | No se puede hacer el reporte de auditoría de usuarios ni registrar quién exportó qué. | Agregar tabla `BitacoraAccion` (ver 3.4). |
| `MovimientoInventario` y `Insumo` **no guardan costo**. | No se puede valorizar inventario ni consumo directamente. | Valorizar con **precio promedio ponderado** de `DetalleOrdenCompra` o agregar `costoUnitario` al movimiento. Decidir antes del sprint de inventario. |
| `Cotizacion` tiene `estado` pero no marca cuál fue la adjudicada. | El comparativo de proformas debe inferir la ganadora. | Usar `estado = 'Aceptada'`. |
| No hay tabla de **expediente digital**. | El reporte de expediente se arma uniendo tablas. | Armarlo por `idSolicitud`, que es el hilo común (solicitud → cotización → orden → recepción). |

### 3.4 Tablas nuevas mínimas (propuesta)

```sql
-- Bitácora de acciones: auditoría y registro de exportaciones
CREATE TABLE BitacoraAccion (
  idBitacora   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  idUsuario    INT NOT NULL REFERENCES Usuario(idUsuario),
  accion       VARCHAR(50)  NOT NULL,   -- 'CONSULTA_REPORTE', 'EXPORTA_PDF', 'EXPORTA_XLSX', ...
  modulo       VARCHAR(50)  NOT NULL,   -- 'Reportes'
  detalle      TEXT NULL,               -- código de reporte y filtros usados (JSON)
  fechaAccion  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permisos del módulo (se insertan en la tabla Permiso existente)
-- reportes.ver, reportes.exportar, reportes.auditoria
```

---

## 4. Catálogo de reportes

Cada reporte tiene un código para trazarlo en el backlog, en las pruebas y en el criterio de aceptación.

### 4.1 Inventario y Kardex

| Código | Reporte | Tablas | Filtros |
|---|---|---|---|
| RPT-01 | **Kardex por insumo** (entradas, salidas, saldo) | `MovimientoInventario`, `Insumo`, `CategoriaInsumo`, `Usuario`, `Persona` | insumo (obligatorio), rango de fechas |
| RPT-02 | **Existencias actuales y alertas de stock mínimo** | `Insumo`, `CategoriaInsumo` | categoría, solo bajo mínimo |
| RPT-03 | **Rotación de insumos** | `MovimientoInventario`, `Insumo` | rango de fechas, categoría |
| RPT-04 | **Consumo por dependencia** | `ValeSalida`, `DetalleValeSalida`, `Dependencia`, `Insumo`, `CategoriaInsumo` | dependencia, categoría, fechas |

### 4.2 Compras y proveedores

| Código | Reporte | Tablas | Filtros |
|---|---|---|---|
| RPT-05 | **Solicitudes de compra** por estado, prioridad y dependencia | `SolicitudCompra`, `DetalleSolicitud`, `Dependencia` | dependencia, estado, prioridad, fechas |
| RPT-06 | **Historial de compras por proveedor** | `OrdenCompra`, `DetalleOrdenCompra`, `Proveedor` | proveedor, estado, fechas |
| RPT-07 | **Comparativo de proformas** | `Cotizacion`, `DetalleCotizacion`, `Proveedor` | solicitud (obligatorio) |
| RPT-08 | **Órdenes de compra: estado y cumplimiento** | `OrdenCompra`, `RecepcionInsumo` | estado, proveedor, fechas |
| RPT-09 | **Recepciones en bodega** (recibido vs. aceptado, novedades) | `RecepcionInsumo`, `DetalleRecepcion`, `Insumo` | proveedor, estado de recepción, fechas |
| RPT-10 | **Desempeño de proveedores** (cumplimiento, tiempo de entrega) | `OrdenCompra`, `RecepcionInsumo`, `DetalleRecepcion`, `Proveedor` | proveedor, fechas |

### 4.3 Ejecutivos y auditoría

| Código | Reporte | Tablas | Filtros |
|---|---|---|---|
| RPT-11 | **Resumen ejecutivo / estado general del almacén** (compras comprometidas, consumo, existencias) | `OrdenCompra`, `ValeSalida`, `Insumo`, `Dependencia` | rango de fechas |
| RPT-12 | **Expediente digital por solicitud** (solicitud → cotizaciones → orden → recepción → vales) | `SolicitudCompra`, `Cotizacion`, `OrdenCompra`, `RecepcionInsumo`, `MovimientoInventario` | solicitud (obligatorio) |
| RPT-13 | **Auditoría de actividad de usuarios** | `BitacoraAccion`, `Usuario`, `Persona`, `Rol` | usuario, acción, fechas |

### 4.4 Priorización sugerida (MoSCoW)

- **Must:** RPT-01, RPT-02, RPT-04, RPT-06, RPT-11 (son los que nombra el DERCAS: stock, consumo por dependencia, historial por proveedor, estado general).
- **Should:** RPT-03, RPT-05, RPT-07, RPT-08, RPT-09, RPT-12 (apoyan la fiscalización de la CGC).
- **Could:** RPT-10, RPT-13 (requieren más datos acumulados o la tabla nueva).

---

## 5. Arquitectura del módulo

```
React (SPA)  ──HTTPS/JSON──►  API Node.js (MVC)  ──SQL──►  PostgreSQL
 /reportes                    /api/reportes                  vistas vw_rpt_*
 filtros, tablas,             permisos, validación,          índices, rol de BD
 gráficos, exportar           PDF / Excel                    de solo lectura
```

Todo corre en contenedores Docker y se despliega en Azure.

### 5.1 Estructura de carpetas sugerida (back-end)

```
src/modules/reportes/
├── reportes.routes.js        # rutas y middleware de permisos
├── reportes.controller.js    # recibe filtros, responde JSON o archivo
├── reportes.service.js       # reglas: validar filtros, armar totales
├── reportes.repository.js    # consultas SQL parametrizadas
├── catalogo.js               # definición de cada reporte (código, filtros, columnas)
├── validadores/              # esquemas de filtros por reporte
└── exportadores/
    ├── excel.exporter.js
    └── pdf.exporter.js
```

La idea es un **catálogo declarativo**: cada reporte se define con código, nombre, permiso requerido, filtros, columnas y consulta. Así, agregar el reporte número 14 no exige crear una pantalla ni un exportador nuevos.

### 5.2 Estructura de carpetas sugerida (front-end)

```
src/modules/reportes/
├── pages/ CatalogoReportes.jsx, VisorReporte.jsx
├── components/ PanelFiltros.jsx, TablaReporte.jsx, GraficoReporte.jsx, BotonesExportar.jsx
├── services/ reportesApi.js
└── hooks/ useReporte.js
```

### 5.3 Contrato de la API

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/reportes` | Catálogo de reportes **visibles para el rol** del usuario. |
| GET | `/api/reportes/:codigo` | Datos en JSON con filtros, paginación y totales. |
| GET | `/api/reportes/:codigo/exportar?formato=pdf\|xlsx` | Descarga del archivo con los mismos filtros. |
| GET | `/api/reportes/filtros/opciones` | Listas para los filtros (dependencias, proveedores, categorías, insumos). |

**Filtros estándar** (query string): `fechaInicio`, `fechaFin`, `idDependencia`, `idProveedor`, `idCategoria`, `idInsumo`, `idSolicitud`, `estado`, `prioridad`, `page`, `pageSize`.

**Respuesta JSON:**

```json
{
  "codigo": "RPT-06",
  "titulo": "Historial de compras por proveedor",
  "filtros": { "fechaInicio": "2026-01-01", "fechaFin": "2026-09-30" },
  "columnas": [{ "campo": "nombreEmpresa", "titulo": "Proveedor" }],
  "filas": [],
  "totales": { "montoTotal": "0.00" },
  "paginacion": { "page": 1, "pageSize": 50, "total": 0 },
  "generadoEn": "2026-10-05T10:00:00-06:00"
}
```

### 5.4 Seguridad y control de acceso

- Cada reporte exige un permiso del catálogo `Permiso` (por ejemplo `reportes.ver`, `reportes.exportar`, `reportes.auditoria`), asignado por rol en `Rol_Permiso`.
- Middleware en la API que valida el permiso **en el servidor**; ocultar un botón en React no es seguridad.
- Roles de ejemplo que mencionan los documentos: Administrador, Encargado de Compras, Bodega, Encargada de Inventario, DAFIM / Jefe Financiero, Alcalde. La matriz exacta se define con la municipalidad.
- Consultas **parametrizadas** siempre; nunca concatenar filtros en el SQL.
- Usuario de base de datos **de solo lectura** para el módulo de reportes.
- Cada consulta y exportación se registra en `BitacoraAccion`.
- Los reportes de auditoría (RPT-13) solo para Administrador y Auditor.

---

## 6. Ejemplos de consultas (PostgreSQL)

Son ilustrativas; ajústalas a los nombres finales de tu script de creación. Si creaste las tablas sin comillas, PostgreSQL las guarda en minúsculas y estas consultas funcionan igual.

### 6.1 RPT-01 Kardex por insumo

```sql
CREATE OR REPLACE VIEW vw_rpt_kardex AS
SELECT
  m.idMovimiento,
  m.fechaMovimiento,
  i.idInsumo,
  i.nombreInsumo,
  c.nombreCategoria,
  i.unidadMedida,
  CASE WHEN m.tipoMovimiento = 'Entrada' THEN m.cantidad END AS entrada,
  CASE WHEN m.tipoMovimiento = 'Salida'  THEN m.cantidad END AS salida,
  m.cantidadExistente AS saldo,
  m.referencia,
  m.descripcion,
  TRIM(CONCAT(p.primerNombre, ' ', p.primerApellido)) AS usuario
FROM MovimientoInventario m
JOIN Insumo i          ON i.idInsumo = m.idInsumo
JOIN CategoriaInsumo c ON c.idCategoria = i.idCategoria
JOIN Usuario u         ON u.idUsuario = m.idUsuario
LEFT JOIN Persona p    ON p.idPersona = u.idPersona;

-- Uso:
-- SELECT * FROM vw_rpt_kardex
--  WHERE idInsumo = $1 AND fechaMovimiento >= $2 AND fechaMovimiento < $3
--  ORDER BY fechaMovimiento, idMovimiento;
```

### 6.2 RPT-02 Existencias y stock bajo el mínimo

```sql
SELECT i.idInsumo, i.nombreInsumo, c.nombreCategoria, i.unidadMedida,
       i.stockActual, i.stockMinimo,
       (i.stockMinimo IS NOT NULL AND i.stockActual <= i.stockMinimo) AS bajo_minimo
FROM Insumo i
JOIN CategoriaInsumo c ON c.idCategoria = i.idCategoria
WHERE ($1::int IS NULL OR i.idCategoria = $1)
ORDER BY bajo_minimo DESC, i.nombreInsumo;
```

### 6.3 RPT-04 Consumo por dependencia

```sql
SELECT d.nombreDependencia, c.nombreCategoria, i.nombreInsumo, i.unidadMedida,
       SUM(dv.cantidadSalida)            AS cantidad_total,
       COUNT(DISTINCT v.idValeSalida)    AS vales
FROM ValeSalida v
JOIN DetalleValeSalida dv ON dv.idValeSalida = v.idValeSalida
JOIN Dependencia d        ON d.idDependencia = v.idDependencia
JOIN Insumo i             ON i.idInsumo = dv.idInsumo
JOIN CategoriaInsumo c    ON c.idCategoria = i.idCategoria
WHERE v.estado = 'Entregado'
  AND v.fechaSalida >= $1 AND v.fechaSalida < $2
  AND ($3::int IS NULL OR v.idDependencia = $3)
GROUP BY d.nombreDependencia, c.nombreCategoria, i.nombreInsumo, i.unidadMedida
ORDER BY d.nombreDependencia, cantidad_total DESC;
```

### 6.4 RPT-06 Historial de compras por proveedor

```sql
SELECT pr.nombreEmpresa, pr.nit,
       COUNT(*)                 AS ordenes,
       SUM(oc.montoTotal)       AS monto_total,
       MIN(oc.fechaEmision)     AS primera_compra,
       MAX(oc.fechaEmision)     AS ultima_compra
FROM OrdenCompra oc
JOIN Proveedor pr ON pr.idProveedor = oc.idProveedor
WHERE oc.estado <> 'Cancelada'
  AND oc.fechaEmision >= $1 AND oc.fechaEmision < $2
  AND ($3::int IS NULL OR oc.idProveedor = $3)
GROUP BY pr.nombreEmpresa, pr.nit
ORDER BY monto_total DESC;
```

> No unir `DetalleOrdenCompra` en esta consulta: multiplicaría `montoTotal` por el número de líneas.

---

## 7. Plan por fases (Scrum)

Estimación orientada a un solo desarrollador, con sprints de **2 semanas**. Los tiempos son una base; ajústalos a tu cronograma del DERCAS.

### Sprint 0 — Preparación (1 semana)

- [ ] Decidir y documentar las inconsistencias de la sección 2.2 (Node.js vs .NET; SQL Server vs PostgreSQL).
- [ ] Crear script PostgreSQL del modelo completo a partir del diccionario de datos.
- [ ] Crear tabla `BitacoraAccion` y permisos del módulo.
- [ ] Definir con la municipalidad la **matriz rol × reporte**.
- [ ] Preparar `docker-compose` (web, API, PostgreSQL) y repositorio GitHub con ramas (`main`, `develop`, `feature/reportes-*`).
- [ ] Cargar **datos de prueba realistas** (insumos, proveedores, solicitudes, órdenes, recepciones, vales, movimientos).

### Sprint 1 — Base del módulo (2 semanas)

- [ ] Estructura de carpetas back-end y front-end.
- [ ] Catálogo declarativo de reportes y endpoint `GET /api/reportes` filtrado por permisos.
- [ ] Middleware de autenticación y autorización por permiso.
- [ ] Pantalla `CatalogoReportes` y componente `PanelFiltros`.
- [ ] Endpoint de opciones de filtros.
- [ ] Registro en `BitacoraAccion`.

### Sprint 2 — Inventario y Kardex (2 semanas)

- [ ] Vistas SQL e índices para RPT-01 y RPT-02.
- [ ] Reportes RPT-01 (Kardex) y RPT-02 (existencias y stock mínimo).
- [ ] `TablaReporte` con paginación y totales.
- [ ] **Validación cruzada:** el saldo final del Kardex debe coincidir con `Insumo.stockActual`.
- [ ] RPT-03 (rotación) y RPT-04 (consumo por dependencia).

### Sprint 3 — Compras y proveedores (2 semanas)

- [ ] RPT-05 (solicitudes), RPT-06 (historial por proveedor) y RPT-07 (comparativo de proformas).
- [ ] RPT-08 y RPT-09 (órdenes y recepciones).
- [ ] Decisión sobre la valorización del inventario (3.3) e implementación del cálculo.
- [ ] Primeras pruebas de rendimiento con volumen de datos.

### Sprint 4 — Exportación PDF y Excel (2 semanas)

- [ ] Exportador Excel (`exceljs`): encabezado institucional, filtros aplicados, fecha de generación, totales.
- [ ] Exportador PDF (`pdfmake` / `pdfkit`): logo, título, filtros, tabla paginada, pie con "Generado por" y fecha.
- [ ] `BotonesExportar` con estado de carga y manejo de errores.
- [ ] Verificar que el total del archivo coincide con el total en pantalla.
- [ ] Formato Q (quetzales) con 2 decimales y zona horaria `America/Guatemala`.

### Sprint 5 — Ejecutivos y auditoría (2 semanas)

- [ ] RPT-11 (resumen ejecutivo) con gráficos (Recharts).
- [ ] RPT-12 (expediente digital por solicitud) para fiscalización.
- [ ] RPT-13 (auditoría de usuarios) y RPT-10 (desempeño de proveedores).
- [ ] Exponer indicadores resumidos para el módulo **Dashboard** (reutilizar los mismos servicios).

### Sprint 6 — Pruebas, despliegue y capacitación (2 semanas)

- [ ] Colección Postman completa (casos válidos, filtros inválidos, sin permiso, sin datos).
- [ ] Pruebas con usuarios clave: Encargado de Compras, DAFIM, Encargada de Inventario, Alcalde.
- [ ] Ajustes de usabilidad y de formato de impresión.
- [ ] Imagen Docker final y despliegue en Azure.
- [ ] Manual breve de usuario y sesión de capacitación (objetivo específico del DERCAS).
- [ ] Prueba piloto con el personal de Almacén y Suministros.

### Resumen de tiempos

| Sprint | Enfoque | Duración |
|---|---|---|
| 0 | Preparación | 1 semana |
| 1 | Base del módulo | 2 semanas |
| 2 | Inventario y Kardex | 2 semanas |
| 3 | Compras y proveedores | 2 semanas |
| 4 | Exportación PDF/Excel | 2 semanas |
| 5 | Ejecutivos y auditoría | 2 semanas |
| 6 | Pruebas, despliegue, capacitación | 2 semanas |
| **Total** | | **≈ 13 semanas** |

---

## 8. Rendimiento y calidad de datos

### 8.1 Índices recomendados

```sql
CREATE INDEX idx_mov_insumo_fecha   ON MovimientoInventario (idInsumo, fechaMovimiento);
CREATE INDEX idx_vale_dep_fecha     ON ValeSalida (idDependencia, fechaSalida);
CREATE INDEX idx_detvale_insumo     ON DetalleValeSalida (idInsumo);
CREATE INDEX idx_orden_prov_fecha   ON OrdenCompra (idProveedor, fechaEmision);
CREATE INDEX idx_solic_dep_fecha    ON SolicitudCompra (idDependencia, fechaSolicitud);
CREATE INDEX idx_cotiz_solicitud    ON Cotizacion (idSolicitud);
CREATE INDEX idx_recep_orden        ON RecepcionInsumo (idOrdenCompra);
CREATE INDEX idx_bitacora_fecha     ON BitacoraAccion (fechaAccion, idUsuario);
```

### 8.2 Buenas prácticas

- Paginación en servidor y límite de filas en la exportación (por ejemplo, 50 000).
- Vistas materializadas solo si un reporte se vuelve lento (probable en RPT-03 y RPT-11).
- La exportación se genera en el servidor, **no** en el navegador, porque el equipo de la municipalidad es antiguo y la red tiene cortes (limitaciones del DERCAS).
- Manejar `NUMERIC` como texto o con una librería decimal en Node.js para no perder precisión en montos.
- Solo cuentan los vales en estado `Entregado` para consumo y las órdenes distintas de `Cancelada` para compras.

### 8.3 Consultas de control de calidad

```sql
-- Saldo del Kardex vs. stock actual (debe devolver 0 filas)
SELECT i.idInsumo, i.stockActual, ult.cantidadExistente
FROM Insumo i
JOIN LATERAL (
  SELECT cantidadExistente FROM MovimientoInventario m
  WHERE m.idInsumo = i.idInsumo
  ORDER BY fechaMovimiento DESC, idMovimiento DESC LIMIT 1
) ult ON TRUE
WHERE i.stockActual <> ult.cantidadExistente;
```

---

## 9. Plan de pruebas y criterios de aceptación

### 9.1 Pruebas

| Tipo | Qué se prueba |
|---|---|
| Datos | Cuadre Kardex vs. `stockActual`; totales de reportes vs. suma manual en SQL. |
| API (Postman) | Respuesta 200 con filtros válidos; 400 con filtros inválidos; 401 sin sesión; 403 sin permiso; respuesta vacía correcta. |
| Exportación | PDF y Excel abren sin error; totales y filtros coinciden con pantalla; caracteres con tildes y ñ correctos. |
| Seguridad | Un rol sin permiso no puede ver ni exportar; intentos de inyección en filtros rechazados. |
| Rendimiento | Reportes principales responden en pocos segundos con un volumen de datos representativo (definir meta con el usuario). |
| Usabilidad | Usuarios clave generan sus reportes sin ayuda. |

### 9.2 Criterios de aceptación del módulo

- [ ] Los reportes Must (RPT-01, 02, 04, 06, 11) están disponibles y exportan a PDF y Excel.
- [ ] Cada reporte respeta filtros y permisos por rol.
- [ ] Los totales del PDF, del Excel y de la pantalla son idénticos.
- [ ] Cada exportación queda registrada con usuario, fecha y filtros.
- [ ] El Kardex cuadra con las existencias actuales.
- [ ] El expediente por solicitud (RPT-12) muestra la cadena completa para una revisión de la CGC.
- [ ] La colección Postman pasa completa.
- [ ] El personal del almacén fue capacitado y completó la prueba piloto.

---

## 10. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Falta de tablas de facturas, pagos y presupuesto limita el reporte financiero. | Alta | Alcance por fases (3.3); comunicar a la municipalidad qué cubre el "estado general" en esta entrega. |
| Poco volumen de datos reales al inicio (no se migran datos en papel). | Alta | Datos de prueba realistas para validar; explicar que los reportes crecen con el uso. |
| Conexión a internet inestable en la municipalidad. | Media | Exportación en servidor, respuestas livianas, mensajes claros de reintento. |
| Diferencias entre el ER del DERCAS y el de la tesis. | Media | Tomar el diccionario del DERCAS como fuente única y actualizar la tesis si cambia. |
| Retrasos al obtener información (Unidad de Información Pública). | Media | Pedir con anticipación los formatos de reporte que ya usan y las reglas de negocio. |
| Cambios de requisitos de formato por parte de la CGC. | Baja | Catálogo declarativo de reportes para ajustar columnas sin rehacer pantallas. |
| Rendimiento con crecimiento de datos. | Baja | Índices, paginación y vistas materializadas. |

---

## 11. Preguntas abiertas para el usuario / la municipalidad

1. ¿El back-end será finalmente **Node.js** o **.NET Core**?
2. ¿Cómo se valoriza el inventario: precio promedio ponderado, último precio o costo en cada movimiento?
3. ¿Qué formatos de reporte oficiales usan hoy (por ejemplo, tarjetas Kardex) que deban reproducirse tal cual?
4. ¿Qué roles pueden ver cada reporte? (matriz rol × reporte)
5. ¿Se construirá el módulo de Facturación y Pagos en esta etapa? Si sí, sus tablas deben diseñarse antes del Sprint 5.
6. ¿Requieren firmas o sellos en el PDF? Recuerda que el DERCAS excluye impresiones automáticas con timbrado sin firma de usuario autorizado.

---

## 12. Entregables

- Script SQL: tablas nuevas, vistas `vw_rpt_*` e índices.
- API de reportes (Node.js) con catálogo, filtros, permisos y exportadores.
- Interfaz React del módulo (catálogo, visor, filtros, exportar).
- Colección Postman y datos de prueba.
- Imágenes Docker y guía de despliegue en Azure.
- Manual de usuario y acta de capacitación / prueba piloto.
