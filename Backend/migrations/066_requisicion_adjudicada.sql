-- 066_requisicion_adjudicada.sql
-- Flag para distinguir solicitudes adjudicadas (flujo especial de proformas)
-- de las que están en revisión/aprobación normal.
ALTER TABLE requisicion ADD COLUMN IF NOT EXISTS adjudicada BOOLEAN NOT NULL DEFAULT FALSE;
