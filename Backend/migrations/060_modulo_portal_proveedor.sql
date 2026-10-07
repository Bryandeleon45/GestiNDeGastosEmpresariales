-- 060_modulo_portal_proveedor.sql  (PostgreSQL 15+)
-- Portal del Proveedor — Módulo "Mis Oportunidades"
-- Extiende el esquema existente (proceso_cotizacion, invitacion_proveedor,
-- cotizacion, notificacion) para soportar el flujo completo del proveedor:
-- borrador -> envío -> retiro/declinación -> resultado -> adjuntos.

-- 1) Invitación: estado de participación del proveedor.
ALTER TABLE invitacion_proveedor
  ADD COLUMN IF NOT EXISTS estado VARCHAR(15) NOT NULL DEFAULT 'Invitado',
  ADD COLUMN IF NOT EXISTS motivo_declina VARCHAR(255),
  ADD COLUMN IF NOT EXISTS fecha_declina TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invitacion_proveedor_estado_check') THEN
    ALTER TABLE invitacion_proveedor
      ADD CONSTRAINT invitacion_proveedor_estado_check
      CHECK (estado IN ('Invitado', 'Declinó'));
  END IF;
END $$;

-- 2) Cotización: marca de envío y estados de borrador/retiro.
ALTER TABLE cotizacion
  ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMPTZ;

ALTER TABLE cotizacion DROP CONSTRAINT IF EXISTS cotizacion_estado_cotizacion_check;
ALTER TABLE cotizacion ADD CONSTRAINT cotizacion_estado_cotizacion_check
  CHECK (estado_cotizacion IN ('Borrador','Recibida','En Evaluación','Aceptada','Rechazada','Retirada'));

-- 3) Adjuntos de la cotización (proforma en PDF/imagen).
CREATE TABLE IF NOT EXISTS documento_cotizacion (
  id_documento     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_cotizacion    INT NOT NULL REFERENCES cotizacion(id_cotizacion) ON DELETE CASCADE,
  nombre_archivo   VARCHAR(255) NOT NULL,
  mime_type        VARCHAR(100) NOT NULL,
  contenido_base64 TEXT,
  fecha_carga      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_cotizacion ON documento_cotizacion (id_cotizacion);
CREATE INDEX IF NOT EXISTS idx_invitacion_estado ON invitacion_proveedor (id_proveedor, estado);

-- 4) Datos de prueba: oportunidades abiertas para que los proveedores puedan
--    cotizar en el portal. Se insertan solo si no existen.
DO $$
DECLARE
  v_req   INT;
  v_proc  INT;
  v_prov  RECORD;
  v_usr   INT;
  v_dep   INT;
  v_per   INT;
BEGIN
  SELECT id_usuario INTO v_usr FROM usuario ORDER BY id_usuario LIMIT 1;
  SELECT id_dependencia INTO v_dep FROM dependencia_municipal ORDER BY id_dependencia LIMIT 1;
  SELECT id_periodo INTO v_per FROM periodo_fiscal WHERE activo LIMIT 1;

  -- Oportunidad 1: Suministros de Oficina (vence en ~1 día -> "por vencer")
  IF NOT EXISTS (SELECT 1 FROM requisicion WHERE codigo_requisicion = 'SC-2026-017') THEN
    INSERT INTO requisicion
      (codigo_requisicion, id_usuario, id_dependencia, id_periodo, tipo_solicitud,
       justificacion, lugar_entrega, prioridad, estado, monto_estimado)
    VALUES
      ('SC-2026-017', v_usr, v_dep, v_per, 'Compra de Materiales',
       'Dotación de suministros de oficina para las dependencias municipales.',
       'Bodega Central, Palacio Municipal', 'Media', 'En Compra', 0)
    RETURNING id_requisicion INTO v_req;

    INSERT INTO detalle_requisicion (id_requisicion, id_insumo, id_unidad_medida, cantidad, observaciones)
    VALUES
      (v_req, 1, 1, 50, 'Resma de 500 hojas'),
      (v_req, 3, 1, 30, NULL),
      (v_req, 4, 1, 100, NULL);

    INSERT INTO proceso_cotizacion
      (id_requisicion, fase, fecha_limite, min_ofertas, id_usuario_publica)
    VALUES
      (v_req, 'Publicada', now() + interval '1 day', 3, v_usr)
    RETURNING id_proceso INTO v_proc;

    FOR v_prov IN SELECT id_proveedor FROM proveedor WHERE activo = TRUE LOOP
      INSERT INTO invitacion_proveedor (id_proceso, id_proveedor)
      VALUES (v_proc, v_prov.id_proveedor);
    END LOOP;
  END IF;

  -- Oportunidad 2: Materiales de Construcción (vence en ~10 días)
  IF NOT EXISTS (SELECT 1 FROM requisicion WHERE codigo_requisicion = 'SC-2026-018') THEN
    INSERT INTO requisicion
      (codigo_requisicion, id_usuario, id_dependencia, id_periodo, tipo_solicitud,
       justificacion, lugar_entrega, prioridad, estado, monto_estimado)
    VALUES
      ('SC-2026-018', v_usr, v_dep, v_per, 'Compra de Materiales',
       'Reparación de aceras y banquetas en la zona 1 del municipio.',
       'Bodega de Obras Públicas', 'Alta', 'En Compra', 0)
    RETURNING id_requisicion INTO v_req;

    INSERT INTO detalle_requisicion (id_requisicion, id_insumo, id_unidad_medida, cantidad, observaciones)
    VALUES
      (v_req, 7, 3, 200, 'Saco de 50 kg'),
      (v_req, 8, 1, 1500, NULL);

    INSERT INTO proceso_cotizacion
      (id_requisicion, fase, fecha_limite, min_ofertas, id_usuario_publica)
    VALUES
      (v_req, 'Publicada', now() + interval '10 days', 3, v_usr)
    RETURNING id_proceso INTO v_proc;

    FOR v_prov IN SELECT id_proveedor FROM proveedor WHERE activo = TRUE LOOP
      INSERT INTO invitacion_proveedor (id_proceso, id_proveedor)
      VALUES (v_proc, v_prov.id_proveedor);
    END LOOP;
  END IF;

  -- Oportunidad 3: Materiales Eléctricos (vence en ~14 días)
  IF NOT EXISTS (SELECT 1 FROM requisicion WHERE codigo_requisicion = 'SC-2026-019') THEN
    INSERT INTO requisicion
      (codigo_requisicion, id_usuario, id_dependencia, id_periodo, tipo_solicitud,
       justificacion, lugar_entrega, prioridad, estado, monto_estimado)
    VALUES
      ('SC-2026-019', v_usr, v_dep, v_per, 'Compra de Materiales',
       'Mantenimiento del alumbrado público del parque central.',
       'Bodega Central, Palacio Municipal', 'Media', 'En Compra', 0)
    RETURNING id_requisicion INTO v_req;

    INSERT INTO detalle_requisicion (id_requisicion, id_insumo, id_unidad_medida, cantidad, observaciones)
    VALUES
      (v_req, 9, 2, 500, NULL),
      (v_req, 10, 1, 40, 'LED 50W luz cálida');

    INSERT INTO proceso_cotizacion
      (id_requisicion, fase, fecha_limite, min_ofertas, id_usuario_publica)
    VALUES
      (v_req, 'Publicada', now() + interval '14 days', 3, v_usr)
    RETURNING id_proceso INTO v_proc;

    FOR v_prov IN SELECT id_proveedor FROM proveedor WHERE activo = TRUE LOOP
      INSERT INTO invitacion_proveedor (id_proceso, id_proveedor)
      VALUES (v_proc, v_prov.id_proveedor);
    END LOOP;
  END IF;
END $$;
