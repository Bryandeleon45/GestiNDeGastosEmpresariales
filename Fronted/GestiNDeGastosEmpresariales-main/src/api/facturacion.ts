import { api } from "./client"

export interface Factura {
  id_factura: number
  id_orden_compra: number
  id_proveedor: number
  serie: string | null
  numero_factura: string
  numero_autorizacion: string | null
  npg: string | null
  fecha_emision: string
  monto_total: string
  plazo_credito_dias: number
  fecha_vencimiento: string
  estado: "Recibida" | "En Revisión" | "Aprobada" | "Rechazada"
  motivo_rechazo: string | null
  observaciones: string | null
  origen: string
  archivo_pdf_nombre: string | null
  archivo_pdf_base64: string | null
  archivo_xml_nombre: string | null
  archivo_xml_base64: string | null
  nit: string
  razon_social: string
  numero_orden: string
  estado_visible: string
  numero_orden_pago?: string | null
  estado_pago?: string | null
  oc_monto?: string
  orden_pago?: OrdenPago | null
}

export interface OrdenCompraFacturable {
  id_orden_compra: number
  numero_orden: string
  monto_total: string
  fecha_emision: string
  plazo_credito_dias: number | null
  id_proveedor: number
  nit: string
  razon_social: string
  total_facturado: string
  recibido_valorizado: string
}

export interface Partida {
  id_partida: number
  codigo: string
  descripcion: string
  activo: boolean
}

export interface Fuente {
  id_fuente: number
  codigo: string
  descripcion: string
  activo: boolean
}

export interface OrdenPago {
  id_orden_pago: number
  numero_orden_pago: string
  id_factura: number
  id_proveedor: number
  concepto: string
  monto: string
  id_partida: number | null
  id_fuente: number | null
  fecha_vencimiento: string
  fecha_pago_programada: string | null
  fecha_pago_real: string | null
  referencia_pago: string | null
  estado: "Pendiente" | "Programada" | "Pagada" | "Anulada"
  motivo_anulacion: string | null
  nit: string
  razon_social: string
  numero_factura: string
  partida_codigo?: string | null
  partida_desc?: string | null
  fuente_codigo?: string | null
  fuente_desc?: string | null
}

export interface ResumenFacturacion {
  total_por_pagar: string
  facturas_pendientes: number
  en_revision: number
  vencimientos_proximos: number
}

export interface CronogramaItem {
  numero_orden_pago: string
  fecha_vencimiento: string
  fecha_pago_programada: string | null
  estado: string
  monto: string
  razon_social: string
  numero_factura: string
}

export function listarFacturas(params: { estado?: string; q?: string } = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, String(v))
  })
  return api.get<Factura[]>(`/facturas${sp.toString() ? `?${sp.toString()}` : ""}`)
}

export function obtenerFactura(id: number | string) {
  return api.get<Factura>(`/facturas/${id}`)
}

export function registrarFactura(data: {
  id_orden_compra: number
  serie?: string
  numero_factura: string
  numero_autorizacion?: string
  npg?: string
  fecha_emision: string
  monto_total: number
  plazo_credito_dias?: number
  observaciones?: string
  archivo_pdf_nombre?: string
  archivo_pdf_base64?: string
  archivo_xml_nombre?: string
  archivo_xml_base64?: string
}) {
  return api.post<Factura>("/facturas", data)
}

export function revisarFactura(id: number | string, accion: "iniciar" | "aprobar" | "rechazar", motivo_rechazo?: string) {
  return api.patch<Factura>(`/facturas/${id}/revision`, { accion, motivo_rechazo })
}

export function listarOrdenesCompraFacturables() {
  return api.get<OrdenCompraFacturable[]>("/facturas/ordenes-compra")
}

export function listarOrdenesPago(params: { estado?: string } = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, String(v))
  })
  return api.get<OrdenPago[]>(`/ordenes-pago${sp.toString() ? `?${sp.toString()}` : ""}`)
}

export function crearOrdenPago(data: {
  id_factura: number
  concepto: string
  monto: number
  id_partida?: number
  id_fuente?: number
  fecha_vencimiento?: string
}) {
  return api.post<OrdenPago>("/ordenes-pago", data)
}

export function programarOrdenPago(id: number | string, data: { fecha_pago_programada?: string; id_partida?: number; id_fuente?: number }) {
  return api.patch<OrdenPago>(`/ordenes-pago/${id}/programar`, data)
}

export function pagarOrdenPago(id: number | string, data: { fecha_pago_real: string; referencia_pago: string }) {
  return api.patch<OrdenPago>(`/ordenes-pago/${id}/pago`, data)
}

export function anularOrdenPago(id: number | string, motivo_anulacion: string) {
  return api.patch<OrdenPago>(`/ordenes-pago/${id}/anular`, { motivo_anulacion })
}

export function obtenerResumenFacturacion() {
  return api.get<ResumenFacturacion>("/facturacion/resumen")
}

export function obtenerCronograma() {
  return api.get<CronogramaItem[]>("/facturacion/cronograma")
}

export function listarPartidas() {
  return api.get<Partida[]>("/partidas")
}

export function listarFuentes() {
  return api.get<Fuente[]>("/fuentes-financiamiento")
}
