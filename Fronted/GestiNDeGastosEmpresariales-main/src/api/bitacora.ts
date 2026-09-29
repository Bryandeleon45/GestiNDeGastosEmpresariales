import { api, getToken } from "./client"

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

export function exportarBitacoraCSV(params: {
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
  const base = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:4000/api"
  const token = getToken()
  const url = `${base}/bitacora/exportar${qs ? `?${qs}` : ""}`
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return { url, headers }
}
