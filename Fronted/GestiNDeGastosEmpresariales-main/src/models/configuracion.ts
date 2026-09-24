// ─── Configuración model ──────────────────────────────────────────────────────
export type ConfigTab = "apariencia" | "perfil" | "notificaciones" | "seguridad" | "auditoria"

export const CONFIG_TABS: { key: ConfigTab label: string }[] = [
  { key: "apariencia", label: "Apariencia y Tema" },
  { key: "perfil", label: "Perfil de Usuario" },
  { key: "notificaciones", label: "Notificaciones" },
  { key: "seguridad", label: "Seguridad y Accesos" },
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
