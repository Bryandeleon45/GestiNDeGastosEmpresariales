// ─── Configuración model ──────────────────────────────────────────────────────
export type ConfigTab = "apariencia" | "perfil" | "notificaciones" | "seguridad" | "dependencias" | "auditoria"

export const CONFIG_TABS: { key: ConfigTab; label: string }[] = [
  { key: "apariencia", label: "Apariencia y Tema" },
  { key: "perfil", label: "Perfil de Usuario" },
  { key: "notificaciones", label: "Notificaciones" },
  { key: "seguridad", label: "Seguridad y Accesos" },
  { key: "dependencias", label: "Dependencias" },
  { key: "auditoria", label: "Auditoría" },
]

export const ACCENT_COLORS = [
  "#1E5E2F",
  "#1D4ED8",
  "#7C3AED",
  "#B45309",
  "#0F766E",
  "#BE123C",
]

export const IDIOMAS = [
  "Español - Guatemala",
  "Español - México",
  "English (US)",
]
export const ZONAS = [
  "UTC-6 America/Guatemala",
  "UTC-5 America/Bogota",
  "UTC-4 America/Caracas",
]

export const PERFIL_FIELDS = [
  { label: "Nombre completo", value: "Ricardo Gómez Barrios" },
  { label: "Cargo", value: "Director Administrativo" },
  { label: "Correo electrónico", value: "r.gomez@munipanajachel.gob.gt" },
  { label: "Extensión", value: "Ext. 214" },
]

export const PASSWORD_FIELDS = [
  { label: "Contraseña actual", ph: "••••••••" },
  { label: "Nueva contraseña", ph: "Mínimo 8 caracteres" },
  { label: "Confirmar contraseña", ph: "Repetir nueva contraseña" },
]

export const AUDITORIA_LOG = [
  { time: "Hoy 09:42", action: "Inicio de sesión", user: "Lic. Ricardo Gómez", status: "exitoso" },
  { time: "Ayer 17:18", action: "Exportación de reporte PDF", user: "Lic. Ricardo Gómez", status: "exitoso" },
  { time: "Ayer 14:05", action: "Modificación de proveedor", user: "Asistente Sánchez", status: "exitoso" },
  { time: "22/10 11:30", action: "Intento de acceso denegado", user: "Usuario desconocido", status: "denegado" },
  { time: "21/10 08:00", action: "Inicio de sesión", user: "Lic. Ricardo Gómez", status: "exitoso" },
]
