// ─── Usuarios model ───────────────────────────────────────────────────────────
export type UserEstado = "Activo" | "Inactivo"

export interface UsuarioRecord {
  id: string
  codigo: string
  nombre: string
  dpi: string
  estado: UserEstado
  telefono: string
  ingreso: string
  tieneAcceso: boolean
  // Campos adicionales usados por la integración con el backend.
  primer_nombre?: string
  apellido?: string
  id_empleado?: number
  id_usuario?: number | null
  nombre_usuario?: string | null
  correo?: string | null
  id_rol?: number | null
  rol?: string | null
  id_dependencia?: number | null
  dependencia?: string | null
  id_puesto?: number | null
  puesto?: string | null
}

export interface CatalogOption {
  id: number
  label: string
}

export interface UsuarioFormData {
  nombre: string
  apellido: string
  dpi: string
  telefono: string
  correo: string
  fecha_nacimiento?: string
  id_dependencia: number | null
  id_puesto: number | null
  acceso: boolean
  nombre_usuario: string
  id_rol: number | null
  clave: string
}

export const USER_ESTADO_STYLE: Record<
  UserEstado,
  {
    bg: string
    color: string
  }
> = {
  Activo: { bg: "#DCFCE7", color: "#16A34A" },
  Inactivo: { bg: "#FEE2E2", color: "#DC2626" },
}
