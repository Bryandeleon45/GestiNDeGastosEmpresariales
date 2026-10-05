import { api } from "./client"

export interface Menu {
  id: number
  nombre: string
  icono: string
  submenus: {
    id: number
    nombre: string
    controlador: string
    vista: string
    icono: string
  }[]
}

export function listarMenus() {
  return api.get<Menu[]>("/menus")
}

export interface Dependencia {
  id_dependencia: number
  nombre_dependencia: string
  siglas: string | null
  ubicacion: string | null
  activo: boolean
  fecha_registro: string
  total_empleados: number
}

export interface Puesto {
  id_puesto: number
  descripcion: string
  salario_base: string | null
  activo: boolean
  total_empleados: number
}

export interface PresupuestoDependencia {
  id_presupuesto: number
  id_dependencia: number
  id_periodo: number
  monto_asignado: string
  anio: number
  periodo_activo: boolean
  monto_ejecutado: string
  monto_disponible: string
}

export interface PresupuestoResumen {
  total_asignado: string
  total_ejecutado: string
  total_disponible: string
  porcentaje_ejecutado: number
}

export function listarDependencias() {
  return api.get<Dependencia[]>("/dependencias")
}

export function crearDependencia(data: { nombre_dependencia: string; ubicacion?: string; siglas?: string }) {
  return api.post<Dependencia>("/dependencias", data)
}

export function editarDependencia(id: number, data: { nombre_dependencia?: string; ubicacion?: string; activo?: boolean; siglas?: string }) {
  return api.put<Dependencia>(`/dependencias/${id}`, data)
}

export function cambiarEstadoDependencia(id: number, activo: boolean) {
  return api.patch<Dependencia>(`/dependencias/${id}/estado`, { activo })
}

export function obtenerPresupuestoDependencia(id: number) {
  return api.get<PresupuestoDependencia>(`/dependencias/${id}/presupuesto`)
}

export function actualizarPresupuestoDependencia(id: number, monto_asignado: number) {
  return api.put<PresupuestoDependencia>(`/dependencias/${id}/presupuesto`, { monto_asignado })
}

export function obtenerResumenPresupuesto() {
  return api.get<PresupuestoResumen>("/dependencias/presupuesto/resumen")
}

export function listarPuestos() {
  return api.get<Puesto[]>("/puestos")
}