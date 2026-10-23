-- ── Recuperación de contraseña por WhatsApp ──────────────────────────────────
-- Agrega el número de WhatsApp (8 dígitos, sin código de país) a las
-- preferencias del usuario. El prefijo +502 se agrega en el envío.

ALTER TABLE usuario_preferencia
  ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(8);

-- Un número de WhatsApp no puede estar asociado a dos usuarios.
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_preferencia_whatsapp
  ON usuario_preferencia (whatsapp)
  WHERE whatsapp IS NOT NULL;
