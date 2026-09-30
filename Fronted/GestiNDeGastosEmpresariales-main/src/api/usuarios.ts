import { api } from "./client"

export interface UsuarioApi {
  id: string
  codigo: string
  nombre: string
  primer_nombre: string
  apellido: string
  dpi: string
  telefono: string | null
  correo: string | null
  ingreso: string | null
  estado: "Activo" | "Inactivo"
  tieneAcceso: boolean
  id_empleado: number
  id_usuario: number | null
  nombre_usuario: string | null
  activo_cuenta: boolean | null
  id_rol: number | null
  rol: string | null
  id_dependencia: number
  dependencia: string
  id_puesto: number
  puesto: string
}

export interface UsuarioListResponse {
  data: UsuarioApi[]
  total: number
  page: number
  pageSize: number
}

export interface UsuarioResumen {
  total: number
  activos: number
  inactivos: number
  con_acceso: number
}

export function listarUsuarios(params: {
  q?: string
  estado?: string
  page?: number
  pageSize?: number
} = {}) {
  const sp = new URLSearchParams()
  if (params.q) sp.set("q", params.q)
  if (params.estado && params.estado !== "todos") sp.set("estado", params.estado)
  if (params.page) sp.set("page", String(params.page))
  if (params.pageSize) sp.set("pageSize", String(params.pageSize))
  const qs = sp.toString()
  return api.get<UsuarioListResponse>(`/usuarios${qs ? `?${qs}` : ""}`)
}

export function resumenUsuarios() {
  return api.get<UsuarioResumen>("/usuarios/resumen")
}

export function crearUsuario(body: object) {
  return api.post<UsuarioApi>("/usuarios", body)
}

export function editarUsuario(id: number | string, body: object) {
  return api.put<UsuarioApi>(`/usuarios/${id}`, body)
}

export function cambiarEstadoUsuario(
  id: number | string,
  accion: "activar" | "desactivar" | "desbloquear",
) {
  return api.patch(`/usuarios/${id}/estado`, { accion })
}

export function resetClaveUsuario(id: number | string, clave_temporal: string) {
  return api.post(`/usuarios/${id}/reset-clave`, { clave_temporal })
}

export function restablecerClaveUsuario(id: number | string) {
  return api.post<{ ok: boolean; clave_temporal: string }>(
    `/usuarios/${id}/restablecer-clave`,
  )
}
