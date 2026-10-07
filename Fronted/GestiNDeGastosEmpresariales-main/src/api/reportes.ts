import { api, getToken } from "./client"

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://localhost:4000/api"

export interface ReporteCatalogo {
  codigo: string
  titulo: string
  descripcion: string
  categoria: string
  requiereInsumo?: boolean
}

export interface ColumnaReporte {
  campo: string
  titulo: string
}

export interface ReporteData {
  codigo: string
  titulo: string
  columnas: ColumnaReporte[]
  filas: Array<Record<string, string | number | null>>
  totales: Record<string, string | number> | null
  grafico: Array<{ name: string; value: string | number }> | null
  extra: {
    solicitudes_por_estado: Array<{ name: string; value: number }>
    ordenes_por_estado: Array<{ name: string; value: number }>
  } | null
}

export interface OpcionesFiltros {
  dependencias: Array<{ id_dependencia: number; nombre_dependencia: string }>
  proveedores: Array<{ id_proveedor: number; razon_social: string; nit: string }>
  categorias: Array<{ id_categoria: number; nombre: string }>
  insumos: Array<{ id_insumo: number; codigo_insumo: string; nombre: string }>
}

export interface FiltrosReporte {
  fechaInicio?: string
  fechaFin?: string
  idDependencia?: number
  idProveedor?: number
  idCategoria?: number
  idInsumo?: number
  estado?: string
  prioridad?: string
}

export function listarReportes() {
  return api.get<ReporteCatalogo[]>("/reportes")
}

export function obtenerOpcionesFiltros() {
  return api.get<OpcionesFiltros>("/reportes/filtros/opciones")
}

export function obtenerReporte(codigo: string, filtros: FiltrosReporte = {}) {
  const sp = new URLSearchParams()
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  return api.get<ReporteData>(`/reportes/${codigo}${sp.toString() ? `?${sp.toString()}` : ""}`)
}

export async function exportarReporte(codigo: string, filtros: FiltrosReporte = {}): Promise<Blob> {
  const sp = new URLSearchParams()
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  const qs = sp.toString()
  const res = await fetch(`${BASE_URL}/reportes/${codigo}/exportar${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.blob()
}
