import { api } from "./client"

// ─── Tipos del módulo de Configuración ────────────────────────────────────────
export interface Preferencias {
  tema: string
  color_acento: string | null
  interfaz_compacta: boolean
  animaciones: boolean
  idioma: string
  zona_horaria: string
  notif_correo: boolean
  notif_sistema: boolean
  alertas_vencimiento: boolean
}

export interface Perfil {
  id_empleado: number
  nombre: string
  apellido: string
  telefono: string | null
  correo: string
  fecha_ingreso: string | null
  cargo: string | null
  nombre_dependencia: string | null
  siglas: string | null
  nombre_usuario: string
  foto: string | null
}

export interface Identidad {
  nombre_institucion: string
  nombre_corto: string
  nombre_sistema: string
  subtitulo_gestion: string
  subtitulo_portal: string
  lema: string | null
  nit_institucional: string | null
  direccion: string | null
  telefono: string | null
  correo_contacto: string | null
  color_principal: string
  colores_acento: string
  logo: string | null
  imagen_login: string | null
}

export interface Parametro {
  clave: string
  valor: string
  descripcion: string
  grupo: string
  tipo: string
  valor_min: string | null
  valor_max: string | null
  opciones: string | null
  orden: number
}

export interface ParametroHistorial {
  id_historial: string
  clave: string
  valor_anterior: string | null
  valor_nuevo: string
  fecha: string
  nombre: string | null
  apellido: string | null
  nombre_usuario: string
}

export interface Notificaciones {
  notif_correo: boolean
  notif_sistema: boolean
  alertas_vencimiento: boolean
}

// ─── Inicial y preferencias ───────────────────────────────────────────────────
export function obtenerInicial() {
  return api.get<{
    identidad: Identidad
    preferencias: Preferencias
    parametros_publicos: Record<string, string>
  }>("/configuracion/inicial")
}

export function obtenerPreferencias() {
  return api.get<Preferencias>("/configuracion/preferencias")
}

export function guardarPreferencias(data: Partial<Preferencias>) {
  return api.put<Preferencias>("/configuracion/preferencias", data)
}

export function patchPreferencia(campo: string, valor: unknown) {
  return api.patch<Preferencias>("/configuracion/preferencias", { [campo]: valor })
}

// ─── Perfil ───────────────────────────────────────────────────────────────────
export function obtenerPerfil() {
  return api.get<Perfil>("/configuracion/perfil")
}

export function guardarPerfil(data: { nombre?: string; apellido?: string; telefono?: string; foto?: string }) {
  return api.put<Perfil>("/configuracion/perfil", data)
}

// ─── Notificaciones ───────────────────────────────────────────────────────────
export function obtenerNotificaciones() {
  return api.get<Notificaciones>("/configuracion/notificaciones")
}

export function guardarNotificaciones(data: Notificaciones) {
  return api.put<Notificaciones>("/configuracion/notificaciones", data)
}

// ─── Identidad (Administración) ───────────────────────────────────────────────
export function obtenerIdentidad() {
  return api.get<Identidad>("/configuracion/identidad")
}

export function guardarIdentidad(data: Partial<Identidad>) {
  return api.put<Identidad>("/configuracion/identidad", data)
}

// ─── Parámetros (Administración) ──────────────────────────────────────────────
export function listarParametros(grupo?: string) {
  const qs = grupo ? `?grupo=${encodeURIComponent(grupo)}` : ""
  return api.get<Parametro[]>(`/configuracion/parametros${qs}`)
}

export function cambiarParametro(clave: string, valor: string) {
  return api.put<{ clave: string; valor: string }>(`/configuracion/parametros/${clave}`, { valor })
}

export function historialParametro(clave: string) {
  return api.get<ParametroHistorial[]>(`/configuracion/parametros/${clave}/historial`)
}

// ─── Catálogos genéricos (Administración) ─────────────────────────────────────
export interface CatalogoInfo {
  clave: string
  label: string
  tabla: string
}

export function listarCatalogosInfo() {
  return api.get<CatalogoInfo[]>("/catalogos")
}

export function listarCatalogo(clave: string) {
  return api.get<Record<string, unknown>[]>(`/catalogos/${clave}`)
}

export function crearCatalogo(clave: string, data: Record<string, unknown>) {
  return api.post<Record<string, unknown>>(`/catalogos/${clave}`, data)
}

export function editarCatalogo(clave: string, id: number, data: Record<string, unknown>) {
  return api.put<Record<string, unknown>>(`/catalogos/${clave}/${id}`, data)
}

export function cambiarEstadoCatalogo(clave: string, id: number, activo: boolean) {
  return api.patch<Record<string, unknown>>(`/catalogos/${clave}/${id}/estado`, { activo })
}

// ─── Días inhábiles (Administración) ──────────────────────────────────────────
export interface DiaInhabil {
  id_dia_inhabil: string
  fecha: string
  descripcion: string | null
}

export function listarDiasInhabiles() {
  return api.get<DiaInhabil[]>("/catalogos/dias-inhabiles")
}

export function crearDiaInhabil(data: { fecha: string; descripcion?: string }) {
  return api.post<DiaInhabil>("/catalogos/dias-inhabiles", data)
}

export function eliminarDiaInhabil(id: number) {
  return api.del(`/catalogos/dias-inhabiles/${id}`)
}
