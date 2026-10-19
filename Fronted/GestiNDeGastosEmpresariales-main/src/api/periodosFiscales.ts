import { api } from "./client"

export interface PeriodoFiscal {
  id_periodo: number
  anio: number
  activo: boolean
  cerrado: boolean
  fecha_inicio: string | null
  fecha_fin: string | null
  fecha_cierre: string | null
  presupuesto_total: string
}

export interface PresupuestoDependencia {
  id_dependencia: number
  nombre_dependencia: string
  siglas: string | null
  monto_asignado: string
  id_presupuesto: number
}

export function listarPeriodos() {
  return api.get<PeriodoFiscal[]>("/periodos-fiscales")
}

export function crearPeriodo(data: { anio: number; fecha_inicio?: string; fecha_fin?: string }) {
  return api.post<PeriodoFiscal>("/periodos-fiscales", data)
}

export function editarPeriodo(id: number, data: { fecha_inicio?: string; fecha_fin?: string }) {
  return api.put<PeriodoFiscal>(`/periodos-fiscales/${id}`, data)
}

export function activarPeriodo(id: number) {
  return api.post<{ ok: boolean }>(`/periodos-fiscales/${id}/activar`)
}

export function cerrarPeriodo(id: number) {
  return api.post<{ ok: boolean }>(`/periodos-fiscales/${id}/cerrar`)
}

export function listarPresupuestos(idPeriodo: number) {
  return api.get<PresupuestoDependencia[]>(`/periodos-fiscales/${idPeriodo}/presupuestos`)
}

export function guardarPresupuesto(idPeriodo: number, idDependencia: number, montoAsignado: number) {
  return api.put<{ ok: boolean }>(`/periodos-fiscales/${idPeriodo}/presupuestos`, {
    id_dependencia: idDependencia,
    monto_asignado: montoAsignado,
  })
}
