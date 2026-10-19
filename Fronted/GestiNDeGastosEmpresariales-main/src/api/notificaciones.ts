import { api } from "./client"

// ─── Notificaciones (campana superior) ────────────────────────────────────────
export interface Notificacion {
  id_notificacion: number
  tipo: string
  titulo: string
  mensaje: string | null
  referencia: string | null
  leida: boolean
  fecha: string
}

export interface NotificacionesRespuesta {
  data: Notificacion[]
  total: number
  no_leidas: number
}

export function obtenerNotificaciones() {
  return api.get<NotificacionesRespuesta>("/notificaciones")
}

export function marcarNotificacionLeida(id: number) {
  return api.patch<{ id_notificacion: number; leida: boolean }>(
    `/notificaciones/${id}/leida`,
  )
}

export function marcarTodasLeidas() {
  return api.post<{ actualizadas: number }>("/notificaciones/leer-todas")
}

export function eliminarNotificacion(id: number) {
  return api.del<{ ok: boolean }>(`/notificaciones/${id}`)
}
