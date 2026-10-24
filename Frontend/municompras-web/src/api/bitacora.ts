import { api } from "./client"

export interface BitacoraEntry {
  id_bitacora: string
  accion: string
  ip_acceso: string | null
  fecha_acceso: string
  modulo: string | null
  detalle: string | null
  nombre_usuario: string
  nombre: string
  apellido: string
}

export interface BitacoraResponse {
  data: BitacoraEntry[]
  total: number
  page: number
  pageSize: number
}

export function listarBitacora(params: {
  usuario?: string
  modulo?: string
  accion?: string
  desde?: string
  hasta?: string
  page?: number
  pageSize?: number
} = {}) {
  const sp = new URLSearchParams()
  if (params.usuario) sp.set("usuario", params.usuario)
  if (params.modulo) sp.set("modulo", params.modulo)
  if (params.accion) sp.set("accion", params.accion)
  if (params.desde) sp.set("desde", params.desde)
  if (params.hasta) sp.set("hasta", params.hasta)
  if (params.page) sp.set("page", String(params.page))
  if (params.pageSize) sp.set("pageSize", String(params.pageSize))
  const qs = sp.toString()
  return api.get<BitacoraResponse>(`/bitacora${qs ? `?${qs}` : ""}`)
}

export interface BitacoraExport {
  data: BitacoraEntry[]
  total: number
  filtros: {
    usuario: string
    modulo: string
    accion: string
    desde: string
    hasta: string
  }
}

export function exportarBitacora(params: {
  usuario?: string
  modulo?: string
  accion?: string
  desde?: string
  hasta?: string
} = {}) {
  const sp = new URLSearchParams()
  if (params.usuario) sp.set("usuario", params.usuario)
  if (params.modulo) sp.set("modulo", params.modulo)
  if (params.accion) sp.set("accion", params.accion)
  if (params.desde) sp.set("desde", params.desde)
  if (params.hasta) sp.set("hasta", params.hasta)
  const qs = sp.toString()
  return api.get<BitacoraExport>(`/bitacora/exportar${qs ? `?${qs}` : ""}`)
}

// Catálogo dinámico de módulos presentes en la bitácora.
export function listarModulos() {
  return api.get<string[]>("/bitacora/modulos")
}
