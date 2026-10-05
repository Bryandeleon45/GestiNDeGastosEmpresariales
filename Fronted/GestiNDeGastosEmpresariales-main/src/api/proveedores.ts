import { api } from "./client"

export type EstadoConexion = "conectado" | "sin_conexion" | "bloqueado"

export interface Proveedor {
  id_proveedor: number
  nit: string
  razon_social: string
  correo: string
  telefono: string | null
  activo: boolean
  representante_legal: string | null
  nombre_contacto: string | null
  telefono_contacto: string | null
  direccion: string | null
  fecha_registro: string
  id_tipo_proveedor: number
  tipo: string
  id_usuario: number | null
  nombre_usuario: string | null
  usuario_activo: boolean | null
  bloqueado_hasta: string | null
  fecha_ultimo_acceso: string | null
  id_rol: number | null
  rol: string | null
  estado_conexion: EstadoConexion
  tiene_acceso: boolean
}

export interface ProveedorListResponse {
  data: Proveedor[]
  total: number
  page: number
  pageSize: number
}

export interface ProveedorResumen {
  total: number
  activos_portal: number
  sin_conexion: number
  bloqueados: number
}

export interface TipoProveedor {
  id_tipo_proveedor: number
  descripcion: string
  activo: boolean
}

export interface RolPortal {
  id_rol: number
  descripcion: string
}

export function listarProveedores(params: {
  q?: string
  tipo?: string
  estado?: string
  page?: number
  pageSize?: number
} = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  return api.get<ProveedorListResponse>(`/proveedores${sp.toString() ? `?${sp.toString()}` : ""}`)
}

export function obtenerResumenProveedores() {
  return api.get<ProveedorResumen>("/proveedores/resumen")
}

export function listarTiposProveedor() {
  return api.get<TipoProveedor[]>("/proveedores/tipos-proveedor")
}

export function listarRolesPortal() {
  return api.get<RolPortal[]>("/proveedores/roles-portal")
}

export function crearProveedor(data: {
  nit: string
  razon_social: string
  id_tipo_proveedor: number
  correo: string
  telefono?: string
}) {
  return api.post<Proveedor>("/proveedores", data)
}

export function conectarProveedor(data: {
  razon_social: string
  nit: string
  correo: string
  telefono?: string
  id_rol: number
  id_tipo_proveedor: number
}) {
  return api.post<{ proveedor: Proveedor; credenciales: { nombre_usuario: string; clave_temporal: string } }>(
    "/proveedores/conectar",
    data,
  )
}

export function cambiarEstadoProveedor(id: number, activo: boolean) {
  return api.patch<Proveedor>(`/proveedores/${id}/estado`, { activo })
}

export function cambiarRolPortal(id: number, id_rol: number) {
  return api.patch<{ ok: boolean }>(`/proveedores/${id}/portal/rol`, { id_rol })
}

export function resetClavePortal(id: number) {
  return api.post<{ clave_temporal: string }>(`/proveedores/${id}/portal/reset-clave`)
}

export function bloquearPortal(id: number, bloquear: boolean) {
  return api.patch<{ ok: boolean }>(`/proveedores/${id}/portal/bloqueo`, { bloquear })
}
