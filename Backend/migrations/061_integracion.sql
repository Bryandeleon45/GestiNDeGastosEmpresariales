-- 061_integracion.sql
-- Integración transversal entre módulos: bitácora uniforme, preferencias,
-- plazo de crédito y vistas compartidas (una sola definición de cada cifra).
-- Ejecutar DESPUÉS de 001..060 (las vistas dependen de sus tablas).

-- 1) Bitácora uniforme para todos los módulos.
--    (modulo y detalle ya existen en 001/003; aquí se agrega entidad y estados).
ALTER TABLE bitacora_acceso
  ADD COLUMN IF NOT EXISTS entidad         VARCHAR(30),
  ADD COLUMN IF NOT EXISTS id_entidad      INT,
  ADD COLUMN IF NOT EXISTS estado_anterior VARCHAR(30),
  ADD COLUMN IF NOT EXISTS estado_nuevo    VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_bitacora_entidad ON bitacora_acceso (entidad, id_entidad);

-- 2) Plazo de crédito: lo cotiza el proveedor y se copia a la orden de compra.
ALTER TABLE cotizacion
  ADD COLUMN IF NOT EXISTS plazo_credito_dias INT CHECK (plazo_credito_dias >= 0);

-- 3) Preferencias de Configuración (portal y gestión administrativa).
CREATE TABLE IF NOT EXISTS usuario_preferencia (
  id_usuario          INT PRIMARY KEY REFERENCES usuario(id_usuario),
  tema                VARCHAR(10) NOT NULL DEFAULT 'claro' CHECK (tema IN ('claro','oscuro')),
  color_acento        VARCHAR(7),
  interfaz_compacta   BOOLEAN NOT NULL DEFAULT FALSE,
  animaciones         BOOLEAN NOT NULL DEFAULT TRUE,
  idioma              VARCHAR(10) NOT NULL DEFAULT 'es-GT',
  zona_horaria        VARCHAR(40) NOT NULL DEFAULT 'America/Guatemala',
  notif_correo        BOOLEAN NOT NULL DEFAULT TRUE,
  notif_sistema       BOOLEAN NOT NULL DEFAULT TRUE,
  alertas_vencimiento BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4) Monto recibido por orden de compra (límite de lo facturable).
CREATE OR REPLACE VIEW v_recibido_oc AS
SELECT oc.id_orden_compra,
       COALESCE(SUM(drb.cantidad_aceptada * doc.precio_unitario), 0)::numeric(12,2) AS monto_recibido
  FROM orden_compra oc
  LEFT JOIN detalle_orden_compra doc ON doc.id_orden_compra = oc.id_orden_compra
  LEFT JOIN detalle_recepcion_bodega drb ON drb.id_detalle_orden = doc.id_detalle_orden
 GROUP BY oc.id_orden_compra;

-- 5) Presupuesto por dependencia: asignado, comprometido, pagado y disponible.
CREATE OR REPLACE VIEW v_presupuesto_dependencia AS
SELECT pd.id_dependencia, pd.id_periodo, pd.monto_asignado,
       COALESCE(SUM(CASE WHEN r.estado IN ('Aprobada','En Compra')
                         THEN COALESCE(r.monto_adjudicado, r.monto_estimado) END), 0)::numeric(12,2) AS comprometido,
       COALESCE(SUM(pg.monto_pagado), 0)::numeric(12,2) AS pagado,
       (pd.monto_asignado
         - COALESCE(SUM(CASE WHEN r.estado IN ('Aprobada','En Compra')
                             THEN COALESCE(r.monto_adjudicado, r.monto_estimado) END), 0))::numeric(12,2) AS disponible
  FROM presupuesto_dependencia pd
  LEFT JOIN requisicion r
         ON r.id_dependencia = pd.id_dependencia AND r.id_periodo = pd.id_periodo
  LEFT JOIN (
    SELECT oc.id_requisicion, SUM(op.monto) AS monto_pagado
      FROM orden_pago op
      JOIN factura f       ON f.id_factura = op.id_factura
      JOIN orden_compra oc ON oc.id_orden_compra = f.id_orden_compra
     WHERE op.estado = 'Pagada'
     GROUP BY oc.id_requisicion
  ) pg ON pg.id_requisicion = r.id_requisicion
 GROUP BY pd.id_dependencia, pd.id_periodo, pd.monto_asignado;

-- 6) Expediente digital: una fila por solicitud con su etapa actual.
CREATE OR REPLACE VIEW v_expediente AS
SELECT r.id_requisicion, r.codigo_requisicion, r.id_dependencia, r.id_periodo,
       r.estado AS estado_solicitud, pc.fase AS fase_cotizacion,
       oc.id_orden_compra, oc.numero_orden, oc.id_proveedor,
       oc.estado AS estado_orden, oc.monto_total AS monto_orden,
       COALESCE(rc.monto_recibido, 0)  AS monto_recibido,
       COALESCE(fa.monto_facturado, 0) AS monto_facturado,
       COALESCE(pa.monto_pagado, 0)    AS monto_pagado,
       CASE
         WHEN r.estado IN ('Rechazada','Cancelada') THEN r.estado
         WHEN oc.id_orden_compra IS NOT NULL
              AND COALESCE(pa.monto_pagado, 0) >= oc.monto_total THEN 'Pagada'
         WHEN COALESCE(fa.monto_facturado, 0) > 0 THEN 'Facturada'
         WHEN oc.estado = 'Entregada' THEN 'Recibida'
         WHEN COALESCE(rc.monto_recibido, 0) > 0 THEN 'Entrega parcial'
         WHEN oc.id_orden_compra IS NOT NULL THEN 'Orden de compra'
         WHEN pc.fase IS NOT NULL THEN 'En cotización'
         ELSE r.estado
       END AS etapa
  FROM requisicion r
  LEFT JOIN proceso_cotizacion pc ON pc.id_requisicion = r.id_requisicion
  LEFT JOIN orden_compra oc       ON oc.id_requisicion = r.id_requisicion AND oc.estado <> 'Cancelada'
  LEFT JOIN v_recibido_oc rc      ON rc.id_orden_compra = oc.id_orden_compra
  LEFT JOIN (SELECT id_orden_compra, SUM(monto_total) AS monto_facturado
               FROM factura WHERE estado <> 'Rechazada' GROUP BY id_orden_compra) fa
         ON fa.id_orden_compra = oc.id_orden_compra
  LEFT JOIN (SELECT f.id_orden_compra, SUM(op.monto) AS monto_pagado
               FROM orden_pago op JOIN factura f ON f.id_factura = op.id_factura
              WHERE op.estado = 'Pagada' GROUP BY f.id_orden_compra) pa
         ON pa.id_orden_compra = oc.id_orden_compra;
