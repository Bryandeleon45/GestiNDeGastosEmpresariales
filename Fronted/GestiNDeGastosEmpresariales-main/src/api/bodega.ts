import { api } from "./client"

export interface Bodega {
  id_bodega: number
  nombre_bodega: string
  ubicacion: string | null
  encargado: string | null
  activo: boolean
}

export interface InsumoInventario {
  id_insumo: number
  codigo_insumo: string
  nombre: string
  descripcion: string | null
  categoria: string
  unidad_simbolo: string
  stock_actual: number
  stock_minimo: number
  nombre_bodega: string | null
  alerta: "OK" | "Bajo" | "Crítico"
}

export interface AlertaStock {
  id_insumo: number
  codigo_insumo: string
  nombre: string
  unidad_simbolo: string
  stock_actual: number
  stock_minimo: number
  alerta: "Bajo" | "Crítico"
}

export interface OrdenCompraRecepcion {
  id_orden_compra: number
  numero_orden: string
  monto_total: string
  fecha_emision: string
  nit: string
  razon_social: string
}

export interface RecepcionItem {
  id_detalle_recepcion: number
  id_recepcion: number
  id_detalle_orden: number
  id_insumo: number
  cantidad_esperada: number
  cantidad_recibida: number
  cantidad_aceptada: number
  estado_item: "Pendiente" | "Recibido" | "Rechazado" | "Faltante"
  observacion: string | null
  codigo_insumo: string
  insumo_nombre: string
  unidad_simbolo: string
}

export interface Recepcion {
  id_recepcion: number
  id_orden_compra: number
  id_bodega: number
  id_usuario: number
  numero_comprobante: string
  fecha_recepcion: string
  estado: "En Proceso" | "Completa" | "Parcial" | "Con Novedades" | "Cancelada"
  observaciones: string | null
  numero_orden: string
  razon_social: string
  nit: string
  nombre_bodega: string
  nombre_usuario: string
  items?: RecepcionItem[]
}

export interface KardexMovimiento {
  id_kardex: string
  id_insumo: number
  id_bodega: number
  tipo_movimiento: "Entrada" | "Salida" | "Ajuste"
  cantidad: number
  stock_anterior: number
  stock_actual: number
  fecha_movimiento: string
  codigo_insumo: string
  insumo_nombre: string
  nombre_bodega: string
  nombre_usuario: string
}

export interface ResumenBodega {
  recepciones: number
  en_proceso: number
  alertas_stock: number
}

export interface ValeSalida {
  id_vale_salida: number
  id_dependencia: number
  id_usuario_solicitante: number
  id_usuario_autoriza: number | null
  fecha_salida: string
  justificacion: string | null
  estado: "Pendiente" | "Autorizado" | "Entregado" | "Cancelado"
  nombre_dependencia?: string
  nombre_usuario?: string
}

export interface ValeItemInput {
  id_insumo: number
  cantidad: number
  observacion?: string
}

export function listarBodegas() {
  return api.get<Bodega[]>("/bodegas")
}

export function listarInventario(params: { categoriaId?: number; q?: string; bajoStock?: boolean } = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  return api.get<InsumoInventario[]>(`/inventario${sp.toString() ? `?${sp.toString()}` : ""}`)
}

export function listarAlertasStock() {
  return api.get<AlertaStock[]>("/inventario/alertas")
}

export function listarOrdenesCompraRecepcion(params: { numero?: string } = {}) {
  const sp = new URLSearchParams()
  if (params.numero) sp.set("numero", params.numero)
  return api.get<OrdenCompraRecepcion[]>(`/ordenes-compra/pendientes-recepcion${sp.toString() ? `?${sp.toString()}` : ""}`)
}

export function crearRecepcion(data: { id_orden_compra: number; id_bodega?: number }) {
  return api.post<Recepcion>("/recepciones", data)
}

export function listarRecepciones() {
  return api.get<Recepcion[]>("/recepciones")
}

export function obtenerRecepcion(id: number | string) {
  return api.get<Recepcion>(`/recepciones/${id}`)
}

export function verificarItemRecepcion(idRecepcion: number | string, idDetalle: number | string, data: { estado_item: string; cantidad_aceptada?: number; observacion?: string }) {
  return api.patch<RecepcionItem>(`/recepciones/${idRecepcion}/items/${idDetalle}`, data)
}

export function finalizarRecepcion(id: number | string) {
  return api.post<{ estado: string; total_aceptado: number }>(`/recepciones/${id}/finalizar`)
}

export function cancelarRecepcion(id: number | string) {
  return api.post<Recepcion>(`/recepciones/${id}/cancelar`)
}

export function listarKardex(params: { insumoId?: number } = {}) {
  const sp = new URLSearchParams()
  if (params.insumoId) sp.set("insumoId", String(params.insumoId))
  return api.get<KardexMovimiento[]>(`/kardex${sp.toString() ? `?${sp.toString()}` : ""}`)
}

export function obtenerResumenBodega() {
  return api.get<ResumenBodega>("/resumen")
}

export function listarValesSalida() {
  return api.get<ValeSalida[]>("/vales-salida")
}

export function crearValeSalida(data: { id_dependencia: number; justificacion?: string; items: ValeItemInput[] }) {
  return api.post<ValeSalida>("/vales-salida", data)
}

export function autorizarValeSalida(id: number | string) {
  return api.patch<ValeSalida>(`/vales-salida/${id}/autorizar`)
}

export function entregarValeSalida(id: number | string) {
  return api.patch<{ ok: boolean }>(`/vales-salida/${id}/entregar`)
}

export function cancelarValeSalida(id: number | string) {
  return api.patch<ValeSalida>(`/vales-salida/${id}/cancelar`)
}
