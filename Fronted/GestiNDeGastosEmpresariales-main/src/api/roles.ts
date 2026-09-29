import { api } from "./client"

export interface Rol {
  id_rol: number
  descripcion: string
  nombre_rol: string | null
  activo: boolean
  fecha_registro: string
  total_usuarios: number
}

export interface SubmenuPermiso {
  id_menu: number
  menu: string
  id_submenu: number
  submenu: string
  controlador: string
  permitido: boolean
}

export function listarRoles() {
  return api.get<Rol[]>("/roles")
}

export function crearRol(body: { descripcion: string; nombre_rol?: string }) {
  return api.post<Rol>("/roles", body)
}

export function editarRol(
  id: number,
  body: { descripcion?: string; nombre_rol?: string; activo?: boolean },
) {
  return api.put<Rol>(`/roles/${id}`, body)
}

export function permisosDeRol(id: number) {
  return api.get<SubmenuPermiso[]>(`/roles/${id}/permisos`)
}

export function guardarPermisosRol(id: number, submenus: number[]) {
  return api.put(`/roles/${id}/permisos`, { submenus })
}
