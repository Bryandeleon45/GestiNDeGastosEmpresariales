import { api } from "./client"

export interface Rol {
  id_rol: number
  descripcion: string
  nombre_rol: string | null
  activo: boolean
  fecha_registro: string
  total_usuarios: number
  es_portal?: boolean
}

export interface PermisoSubmenu {
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

export function crearRol(data: { descripcion: string; nombre_rol?: string }) {
  return api.post<Rol>("/roles", data)
}

export function editarRol(
  id: number,
  data: { descripcion?: string; nombre_rol?: string; activo?: boolean },
) {
  return api.put<Rol>(`/roles/${id}`, data)
}

export function permisosDeRol(id: number) {
  return api.get<PermisoSubmenu[]>(`/roles/${id}/permisos`)
}

export function guardarPermisosRol(id: number, submenus: number[]) {
  return api.put<{ ok: boolean }>(`/roles/${id}/permisos`, { submenus })
}
