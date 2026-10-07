import { api } from "./client"

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

export interface EntregaPortal {
  id_recepcion: number
  numero_comprobante: string
  fecha_recepcion: string
  estado: string
  observaciones: string | null
  numero_orden: string
  id_orden_compra: number
  total_items: number
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
