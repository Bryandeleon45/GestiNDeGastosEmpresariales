import type { EstadoConexion } from "@/api/proveedores"

export type ProvEstadoLabel = "Conectado" | "Sin Conexión" | "Acceso Bloqueado"

export interface ProveedorRow {
  id: number
  initials: string
  avatarColor: string
  name: string
  nit: string
  rol: string
  rolId: number | null
  estado: EstadoConexion
  estadoLabel: ProvEstadoLabel
  ultimaActividad: string
  email: string
  telefono: string
  categoria: string
  activo: boolean
  tieneAcceso: boolean
  nombreUsuario: string | null
}

export const PROV_PAGE_SIZE = 10

export const CONEXION_STYLE: Record<
  EstadoConexion,
  { bg: string; text: string; dot: string; label: ProvEstadoLabel }
> = {
  conectado: { bg: "#DCFCE7", text: "#16A34A", dot: "#16A34A", label: "Conectado" },
  sin_conexion: { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF", label: "Sin Conexión" },
  bloqueado: { bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444", label: "Acceso Bloqueado" },
}

export interface ProvKpiMeta {
  key: string
  label: string
  color: string
  bg: string
}

export const PROV_KPI_META: ProvKpiMeta[] = [
  { key: "total", label: "TOTAL USUARIOS", color: "#1E5E2F", bg: "#E8F5ED" },
  { key: "activos", label: "ACTIVOS PORTAL", color: "#1E5E2F", bg: "#E8F5ED" },
  { key: "sinconexion", label: "SIN CONEXIÓN", color: "#D97706", bg: "#FEF3C7" },
  { key: "bloqueado", label: "ACCESO BLOQUEADO", color: "#DC2626", bg: "#FEE2E2" },
]

const AVATAR_COLORS = ["#D1FAE5", "#FEF3C7", "#FEE2E2", "#DBEAFE", "#EDE9FE"]

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export function avatarColorOf(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}
