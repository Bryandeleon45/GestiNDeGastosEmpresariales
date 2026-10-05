import { api, getToken } from "./client"

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://localhost:4000/api"

export interface RequisicionItem {
  id_insumo?: number | null
  descripcion_libre?: string | null
  id_unidad_medida: number
  cantidad: number
  precio_estimado: number
  observaciones?: string | null
}

export interface Requisicion {
  id_requisicion: number
  codigo_requisicion: string
  id_usuario: number
  id_dependencia: number
  id_periodo: number
  tipo_solicitud: string
  justificacion: string
  lugar_entrega: string | null
  prioridad: "Baja" | "Media" | "Alta" | "Urgente"
  estado: "Pendiente" | "En Revisión" | "Aprobada" | "Rechazada" | "En Compra" | "Cancelada"
  monto_estimado: string
  notas_aprobacion: string | null
  id_usuario_revisor: number | null
  fecha_solicitud: string
  fecha_resolucion: string | null
  nombre_dependencia: string
  siglas: string | null
  nombre_usuario: string
  usuario_nombre: string
  usuario_apellido: string
  periodo_anio: number
  total_items?: number
  item_nombre?: string | null
  item_cantidad?: string | null
  item_unidad?: string | null
  items?: RequisicionItemDetail[]
  bitacora?: BitacoraEntry[]
}

export interface RequisicionItemDetail {
  id_detalle: number
  id_requisicion: number
  id_insumo: number | null
  descripcion_libre: string | null
  id_unidad_medida: number
  cantidad: string
  precio_estimado: string
  observaciones: string | null
  insumo_nombre: string | null
  codigo_insumo: string | null
  unidad_nombre: string
  unidad_simbolo: string
}

export interface BitacoraEntry {
  id_bitacora: number
  id_usuario: number
  accion: string
  ip_acceso: string | null
  fecha_acceso: string
  modulo: string | null
  detalle: string | null
  nombre_usuario: string
}

export interface RequisicionListResponse {
  data: Requisicion[]
  total: number
  page: number
  pageSize: number
}

export interface RequisicionResumen {
  total: number
  pendientes: number
  en_revision: number
  aprobadas: number
  rechazadas: number
  promedio_dias_pendientes: number
  monto_mes_actual: string
}

export interface TipoSolicitud {
  value: string
}

export interface UnidadMedida {
  id_unidad_medida: number
  nombre: string
  simbolo: string
}

export interface Insumo {
  id_insumo: number
  codigo_insumo: string
  nombre: string
  descripcion: string | null
  precio_referencial: string
  id_unidad_medida: number
  unidad_nombre: string
  unidad_simbolo: string
}

export function listarRequisiciones(params: {
  dependencia?: string
  estado?: string
  prioridad?: string
  desde?: string
  hasta?: string
  q?: string
  page?: number
  pageSize?: number
} = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  return api.get<RequisicionListResponse>(`/requisiciones${sp.toString() ? `?${sp.toString()}` : ""}`)
}

export function obtenerResumenRequisiciones(params: { dependencia?: string; desde?: string; hasta?: string } = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  return api.get<RequisicionResumen>(`/requisiciones/resumen${sp.toString() ? `?${sp.toString()}` : ""}`)
}

export function exportarRequisiciones(params: {
  dependencia?: string
  estado?: string
  prioridad?: string
  desde?: string
  hasta?: string
  q?: string
} = {}): Promise<Blob> {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  const qs = sp.toString()
  return fetch(`${BASE_URL}/requisiciones/exportar${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
  }).then((res) => {
    if (!res.ok) throw new Error(`Error ${res.status}`)
    return res.blob()
  })
}

export function obtenerRequisicion(id: number | string) {
  return api.get<Requisicion>(`/requisiciones/${id}`)
}

export function crearRequisicion(data: {
  id_dependencia?: number
  tipo_solicitud?: string
  justificacion: string
  lugar_entrega?: string
  prioridad?: "Baja" | "Media" | "Alta" | "Urgente"
  items: RequisicionItem[]
}) {
  return api.post<Requisicion>("/requisiciones", data)
}

export function editarRequisicion(id: number | string, data: {
  tipo_solicitud?: string
  justificacion: string
  lugar_entrega?: string
  prioridad?: "Baja" | "Media" | "Alta" | "Urgente"
  items: RequisicionItem[]
}) {
  return api.put<Requisicion>(`/requisiciones/${id}`, data)
}

export function cambiarEstadoRequisicion(id: number | string, data: { estado: string; notas_aprobacion?: string }) {
  return api.patch<Requisicion>(`/requisiciones/${id}/estado`, data)
}

export function listarTiposSolicitud() {
  return api.get<string[]>("/requisiciones/tipos-solicitud")
}

export function listarUnidadesMedida() {
  return api.get<UnidadMedida[]>("/requisiciones/unidades-medida")
}

export function buscarInsumos(q: string) {
  return api.get<Insumo[]>(`/requisiciones/insumos?q=${encodeURIComponent(q)}`)
}