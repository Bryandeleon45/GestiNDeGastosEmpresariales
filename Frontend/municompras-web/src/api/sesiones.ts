import { api } from "./client"

export interface Sesion {
  id_sesion: string
  navegador: string | null
  ip_acceso: string | null
  fecha_inicio: string
  ultimo_uso: string
  expira: string
  actual: boolean
}

export function listarSesiones() {
  return api.get<Sesion[]>("/configuracion/sesiones")
}

export function cerrarSesion(id: number) {
  return api.del(`/configuracion/sesiones/${id}`)
}

export function cerrarOtrasSesiones() {
  return api.del("/configuracion/sesiones")
}
