import { api } from "./client"

export interface Proceso {
  id_proceso: number
  id_requisicion: number
  fase: "Publicada" | "Comparación" | "Adjudicada" | "Desierta"
  fecha_publicacion: string
  fecha_limite: string
  min_ofertas: number
  motivo_adjudicacion: string | null
  codigo_requisicion: string
  tipo_solicitud: string
  monto_estimado: string
  nombre_dependencia: string
  total_cotizaciones: number
  total_invitados: number
}

export interface RequisicionAprobada {
  id_requisicion: number
  codigo_requisicion: string
  tipo_solicitud: string
  justificacion: string
  monto_estimado: string
  prioridad: string
  fecha_solicitud: string
  nombre_dependencia: string
}

export interface ProveedorActivo {
  id_proveedor: number
  nit: string
  razon_social: string
  correo: string
  telefono: string | null
}

export interface ProcesoDetalleItem {
  id_detalle: number
  id_requisicion: number
  id_insumo: number | null
  descripcion_libre: string | null
  id_unidad_medida: number
  cantidad: string
  precio_estimado: string
  insumo_nombre: string | null
  codigo_insumo: string | null
  unidad_nombre: string
  unidad_simbolo: string
}

export interface Cotizacion {
  id_cotizacion: number
  id_requisicion: number
  id_proveedor: number
  numero_cotizacion: string
  referencia_proveedor: string | null
  fecha_cotizacion: string
  monto_total: string
  condiciones_pago: string | null
  tiempo_entrega_dias: number | null
  tiempo_entrega_texto: string | null
  estado_cotizacion: "Recibida" | "En Evaluación" | "Aceptada" | "Rechazada"
  cumple_tecnico: boolean | null
  seleccionada: boolean
  motivo_rechazo: string | null
  origen: string
  nit: string
  razon_social: string
}

export interface ProcesoDetalle extends Proceso {
  justificacion: string
  lugar_entrega: string | null
  prioridad: string
  estado_requisicion: string
  items: ProcesoDetalleItem[]
  invitados: Array<{
    id_invitacion: number
    id_proveedor: number
    razon_social: string
    nit: string
    correo: string
  }>
  cotizaciones: Cotizacion[]
}

export interface ComparativaItem {
  id_detalle: number
  cantidad: string
  descripcion_libre: string | null
  insumo_nombre: string | null
  codigo_insumo: string | null
  unidad_nombre: string
  unidad_simbolo: string
}

export interface ComparativaProveedor extends Cotizacion {
  items: Array<{
    id_detalle_requisicion: number
    cantidad_cotizada: string
    precio_unitario: string
    subtotal: string
    descripcion_oferta: string | null
  } | null>
}

export interface Comparativa {
  proceso: Proceso & { monto_adjudicado: string | null }
  items: ComparativaItem[]
  proveedores: ComparativaProveedor[]
  mejorPrecio: Array<number | null>
}

export interface OrdenCompra {
  id_orden_compra: number
  numero_orden: string
  id_requisicion: number
  id_cotizacion: number
  id_proveedor: number
  fecha_emision: string
  fecha_entrega_estimada: string | null
  monto_total: string
  estado: "Pendiente" | "Aprobada" | "Enviada" | "Entregada" | "Cancelada"
  id_usuario_emite: number
  id_usuario_aprobador: number | null
  fecha_aprobacion: string | null
  codigo_requisicion: string
  nit: string
  razon_social: string
  nombre_dependencia: string
}

export function listarProcesos(params: { fase?: string; q?: string } = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, String(v))
  })
  return api.get<Proceso[]>(`/proformas/procesos${sp.toString() ? `?${sp.toString()}` : ""}`)
}

export function listarRequisicionesAprobadas() {
  return api.get<RequisicionAprobada[]>("/proformas/requisiciones-aprobadas")
}

export function listarProveedoresActivos() {
  return api.get<ProveedorActivo[]>("/proformas/proveedores-activos")
}

export function publicarProceso(data: {
  id_requisicion: number
  fecha_limite: string
  min_ofertas?: number
  proveedores: number[]
}) {
  return api.post<Proceso>("/proformas/procesos", data)
}

export function obtenerProceso(id: number | string) {
  return api.get<ProcesoDetalle>(`/proformas/procesos/${id}`)
}

export function registrarCotizacion(
  idProceso: number | string,
  data: {
    id_proveedor: number
    condiciones_pago?: string
    tiempo_entrega_dias?: number
    tiempo_entrega_texto?: string
    referencia_proveedor?: string
    items: Array<{ id_detalle_requisicion: number; cantidad: number; precio_unitario: number; descripcion_oferta?: string }>
  },
) {
  return api.post<Cotizacion>(`/proformas/procesos/${idProceso}/cotizaciones`, data)
}

export function obtenerComparativa(idProceso: number | string) {
  return api.get<Comparativa>(`/proformas/procesos/${idProceso}/comparativa`)
}

export function seleccionarCotizacion(idCotizacion: number | string) {
  return api.patch<Cotizacion>(`/proformas/cotizaciones/${idCotizacion}/seleccionar`)
}

export function adjudicarProceso(idProceso: number | string, data: { id_cotizacion: number; motivo_adjudicacion: string }) {
  return api.post<{ orden: OrdenCompra }>(`/proformas/procesos/${idProceso}/adjudicar`, data)
}

export function declararDesierto(idProceso: number | string, motivo_adjudicacion: string) {
  return api.post<Proceso>(`/proformas/procesos/${idProceso}/desierto`, { motivo_adjudicacion })
}

export function listarOrdenesCompra(params: { estado?: string } = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, String(v))
  })
  return api.get<OrdenCompra[]>(`/proformas/ordenes-compra${sp.toString() ? `?${sp.toString()}` : ""}`)
}

export function cambiarEstadoOrden(id: number | string, estado: string) {
  return api.patch<OrdenCompra>(`/proformas/ordenes-compra/${id}/estado`, { estado })
}
