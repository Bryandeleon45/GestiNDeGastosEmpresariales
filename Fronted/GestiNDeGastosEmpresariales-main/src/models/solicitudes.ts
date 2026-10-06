// ─── Solicitudes model ────────────────────────────────────────────────────────
export type SolPrioridad = "Urgente" | "Media" | "Alta" | "Baja"
export type SolEstado = "Pendiente" | "En Revisión" | "Aprobada" | "Rechazada" | "En Compra" | "Cancelada"

export interface SolicitudRow {
  id: string
  dep: string
  item: string
  cant: string
  prioridad: SolPrioridad
  estado: SolEstado
  fecha: string
  solicitante: string
  justificacion: string
  codigo_requisicion: string
  id_requisicion: number
  monto_adjudicado: string | null
  id_proceso: number | null
  fase_proceso: string | null
  numero_orden: string | null
}

export const PRIORIDAD_STYLE: Record<SolPrioridad, string> = {
  Urgente: "bg-red-50 text-red-600 border border-red-200",
  Alta: "bg-orange-50 text-orange-600 border border-orange-200",
  Media: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Baja: "bg-gray-100 text-gray-600 border border-gray-200",
}

export const ESTADO_SOL_STYLE: Record<SolEstado, string> = {
  Pendiente: "bg-gray-100 text-gray-500 border border-gray-200",
  "En Revisión": "bg-sky-50 text-sky-700 border border-sky-200",
  Aprobada: "bg-green-50 text-green-700 border border-green-200",
  Rechazada: "bg-red-50 text-red-600 border border-red-200",
  "En Compra": "bg-purple-50 text-purple-700 border border-purple-200",
  Cancelada: "bg-slate-50 text-slate-500 border border-slate-200",
}

export const DEPS_LIST = [
  "DMP",
  "DAFIM",
  "DMM",
  "OMSAN",
  "DIGAM",
  "Secretaría",
  "Despacho",
  "Compras y Almacén",
]
