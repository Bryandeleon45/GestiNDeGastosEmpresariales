import { api } from "./client"

export interface DashboardKpis {
  total_solicitudes: number
  solicitudes_pendientes: number
  solicitudes_urgentes: number
  ordenes_pendientes: number
  entregas_parciales: number
  insumos_bajo_minimo: number
  facturas_por_pagar: number
  vales_pendientes: number
  proveedores_activos: number
  compras_comprometidas: string
  solicitudes_mes: number
  solicitudes_mes_anterior: number
  solicitudes_variacion: number | null
  presupuesto_asignado: number
  presupuesto_comprometido: number
  presupuesto_pagado: number
  presupuesto_ejecutado: number
}

export interface DashboardResumen {
  generadoEn: string
  kpis: DashboardKpis
}

export interface GraficoDato {
  name: string
  value: string | number
}

export interface AlertaStock {
  tipo: "STOCK_BAJO"
  codigo_insumo: string
  nombre: string
  unidad: string
  stock_actual: number
  stock_minimo: number
  faltante: number
}

export interface OrdenAtrasada {
  tipo: "ORDEN_ATRASADA"
  numero_orden: string
  razon_social: string
  fecha_entrega_estimada: string
  dias_atraso: string
}

export interface DashboardAlertas {
  stock: AlertaStock[]
  ordenes_atrasadas: OrdenAtrasada[]
}

export interface ActividadReciente {
  codigo_requisicion: string
  fecha_solicitud: string
  nombre_dependencia: string
  estado: string
  prioridad: string
  monto: string
}

export function obtenerResumenDashboard() {
  return api.get<DashboardResumen>("/dashboard/resumen")
}

export function obtenerComprasPorDependencia() {
  return api.get<GraficoDato[]>("/dashboard/graficos/compras-por-dependencia")
}

export function obtenerSolicitudesPorEstado() {
  return api.get<GraficoDato[]>("/dashboard/graficos/solicitudes-por-estado")
}

export function obtenerAlertas() {
  return api.get<DashboardAlertas>("/dashboard/alertas")
}

export function obtenerActividadReciente() {
  return api.get<ActividadReciente[]>("/dashboard/actividad-reciente")
}
