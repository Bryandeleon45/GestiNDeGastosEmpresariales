import { api, getToken } from "./client"

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://localhost:4000/api"

export interface PortalPerfil {
  id_proveedor: number
  nit: string
  razon_social: string
  correo: string
  telefono: string | null
  direccion: string | null
  proveedor_activo: boolean
  representante_legal: string | null
  nombre_contacto: string | null
  telefono_contacto: string | null
  nombre_usuario: string
  correo_usuario: string
  nombre_completo: string
}

export interface PortalResumen {
  abiertas: number
  por_vencer: number
  cotizaciones_enviadas: number
  en_evaluacion: number
  adjudicadas: number
  monto_ejecucion: string
  facturas_pendientes: number
  ordenes: number
}

export type OportunidadEstado =
  | "Nueva"
  | "Abierta"
  | "Cotizada"
  | "Adjudicada"
  | "No adjudicada"
  | "Declinada"
  | "Vencida"
  | "Cancelada"
  | "Cerrada"

export interface Oportunidad {
  id_proceso: number
  id_requisicion: number
  codigo_requisicion: string
  tipo_solicitud: string
  prioridad: string
  monto_estimado: string
  justificacion: string
  dependencia: string
  siglas: string
  fase: string
  fecha_publicacion: string
  fecha_limite: string
  fecha_vista: string | null
  id_cotizacion: number | null
  numero_cotizacion: string | null
  monto_total: string | null
  estado_cotizacion: string | null
  estado: OportunidadEstado
}

export interface OportunidadItem {
  id_detalle: number
  id_requisicion: number
  id_insumo: number | null
  descripcion_libre: string | null
  id_unidad_medida: number
  cantidad: string
  observaciones: string | null
  insumo_nombre: string | null
  codigo_insumo: string | null
  unidad_nombre: string
  unidad_simbolo: string
}

export interface DetalleCotizacionItem {
  id_detalle_cotizacion: number
  id_detalle_requisicion: number
  cantidad_cotizada: string
  precio_unitario: string
  subtotal: string
  descripcion_oferta: string | null
}

export interface OportunidadDetalle extends Omit<Oportunidad, "estado"> {
  lugar_entrega: string | null
  min_ofertas: number
  motivo_adjudicacion: string | null
  estado_invitacion: string
  motivo_declina: string | null
  items: OportunidadItem[]
  cotizacion: (Oportunidad["cotizacion"] & {
    items?: DetalleCotizacionItem[]
  }) | null
  estado: OportunidadEstado
}

export interface NotificacionPortal {
  id_notificacion: number
  tipo: string
  titulo: string
  mensaje: string
  referencia: string | null
  leida: boolean
  fecha: string
}

export interface OrdenPortal {
  id_orden_compra: number
  numero_orden: string
  fecha_emision: string
  fecha_entrega_estimada: string | null
  monto_total: string
  estado: string
  codigo_requisicion: string
  tipo_solicitud: string
  total_facturado: string
}

export interface EntregaItemDetalle {
  id_detalle_recepcion: number
  descripcion: string
  cantidad_esperada: number
  cantidad_recibida: number
  cantidad_aceptada: number
  estado_item: string
  observacion: string | null
  unidad_simbolo: string
}

export interface EntregaPortal {
  id_recepcion: number
  numero_comprobante: string
  fecha_recepcion: string
  estado: string
  observaciones: string | null
  numero_orden: string
  id_orden_compra: number
  nombre_bodega: string
  ubicacion: string | null
  encargado: string | null
  recibido_por: string | null
  nombre_dependencia: string
  total_items: number
  items: EntregaItemDetalle[]
}

export function obtenerPerfilPortal() {
  return api.get<PortalPerfil>("/portal/perfil")
}

export function obtenerResumenPortal() {
  return api.get<PortalResumen>("/portal/resumen")
}

export function listarOportunidades(tab: string = "abiertas", q?: string) {
  const sp = new URLSearchParams({ tab })
  if (q) sp.set("q", q)
  return api.get<Oportunidad[]>(`/portal/oportunidades?${sp.toString()}`)
}

export function obtenerOportunidad(idProceso: number) {
  return api.get<OportunidadDetalle>(`/portal/oportunidades/${idProceso}`)
}

export function guardarBorradorCotizacion(
  idProceso: number,
  data: {
    condiciones_pago: string
    tiempo_entrega_dias?: number
    tiempo_entrega_texto?: string
    referencia_proveedor?: string
    plazo_credito_dias?: number
    items: { id_detalle_requisicion: number; precio_unitario: string; descripcion_oferta?: string }[]
  },
) {
  return api.put<{ id_cotizacion: number; monto_total: string }>(
    `/portal/oportunidades/${idProceso}/cotizacion`,
    data,
  )
}

export function enviarCotizacion(idProceso: number) {
  return api.post<{ constancia: string; numero_cotizacion: string; monto_total: string }>(
    `/portal/oportunidades/${idProceso}/cotizacion/enviar`,
  )
}

export function retirarCotizacion(idProceso: number) {
  return api.post<{ ok: boolean }>(`/portal/oportunidades/${idProceso}/cotizacion/retirar`)
}

export function declinarOportunidad(idProceso: number, motivo?: string) {
  return api.post<{ ok: boolean }>(`/portal/oportunidades/${idProceso}/declinar`, { motivo })
}

export function listarNotificaciones() {
  return api.get<{ data: NotificacionPortal[]; no_leidas: number }>("/portal/notificaciones")
}

export function marcarNotificacionLeida(id: number) {
  return api.patch<{ ok: boolean }>(`/portal/notificaciones/${id}/leida`)
}

export function listarOrdenes() {
  return api.get<OrdenPortal[]>("/portal/ordenes")
}

export function listarEntregas() {
  return api.get<EntregaPortal[]>("/portal/entregas")
}

export interface PedidoAsignadoItem {
  id_detalle: number
  descripcion: string
  cantidad: string
  unidad: string
  observaciones: string | null
}

export interface PedidoAsignado {
  id_requisicion: number
  codigo_requisicion: string
  tipo_solicitud: string
  prioridad: string
  justificacion: string
  dependencia: string
  lugar_entrega: string | null
  fecha_solicitud: string
  fecha_asignacion: string
  estado: string
  monto_estimado: string
  estado_orden: string | null
  numero_orden: string | null
  items: PedidoAsignadoItem[]
  documentos: { nombre_archivo: string; contenido_base64: string }[]
}

export function listarPedidosAsignados() {
  return api.get<PedidoAsignado[]>("/portal/pedidos-asignados")
}

export interface OrdenFacturable {
  id_orden_compra: number
  numero_orden: string
  fecha_emision: string
  monto_total: string
  estado: string
  codigo_requisicion: string
  tipo_solicitud: string
  total_facturado: string
  recibido_valorizado: string
  id_cotizacion: number | null
  es_proforma: boolean
  numero_cotizacion: string | null
  monto_adjudicado: string
  plazo_credito_dias: number | null
}

export interface OrdenFacturableItem {
  id_detalle_orden: number
  descripcion: string
  cantidad_comprada: string
  precio_unitario: string
  subtotal: string
  unidad_simbolo: string
  cantidad_recibida: string
}

export interface OrdenFacturableDetalle extends OrdenFacturable {
  justificacion: string | null
  lugar_entrega: string | null
  nombre_dependencia: string
  items: OrdenFacturableItem[]
}

export interface FacturaPortal {
  id_factura: number
  numero_factura: string
  serie: string | null
  fecha_emision: string
  monto_total: string
  estado: string
  fecha_registro: string
  observaciones: string | null
  numero_orden: string
  id_orden_compra: number
  codigo_requisicion: string
}

export function listarOrdenesFacturables() {
  return api.get<OrdenFacturable[]>("/portal/ordenes-facturables")
}

export function obtenerOrdenFacturable(id: number | string) {
  return api.get<OrdenFacturableDetalle>(`/portal/ordenes-facturables/${id}`)
}

export function listarFacturas() {
  return api.get<FacturaPortal[]>("/portal/facturas")
}

export function registrarFacturaPortal(data: {
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
  return api.post<FacturaPortal>("/portal/facturas", data)
}

export interface InformeFiltros {
  fechaInicio?: string
  fechaFin?: string
  estado?: string
  q?: string
}

export interface InformeFila {
  id_orden_compra: number
  codigo_requisicion: string
  dependencia: string
  tipo_solicitud: string
  numero_orden: string
  fecha_emision: string
  monto_orden: string
  estado_orden: string
  recibido_valorizado: string
  estado_recepcion: string | null
  fecha_recepcion: string
  facturado: string
  estado_factura: string | null
  pagado: string
  estado_pago: string | null
  fecha_pago: string
  pagada: boolean
  recibida_en_bodega: boolean
  estado: string
}

export interface InformeTotales {
  ordenes: number
  monto_orden: string
  recibido: string
  facturado: string
  pagado: string
  pendientes: number
}

export interface InformePortal {
  filas: InformeFila[]
  totales: InformeTotales
  proveedor: { razon_social: string; nit: string }
}

export function obtenerInformePortal(filtros: InformeFiltros = {}) {
  const sp = new URLSearchParams()
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  return api.get<InformePortal>(`/portal/informe${sp.toString() ? `?${sp.toString()}` : ""}`)
}

export async function exportarInformePortal(
  formato: "csv" | "pdf",
  filtros: InformeFiltros = {},
): Promise<Blob> {
  const sp = new URLSearchParams()
  sp.set("formato", formato)
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  const res = await fetch(`${BASE_URL}/portal/informe/exportar?${sp.toString()}`, {
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.blob()
}
