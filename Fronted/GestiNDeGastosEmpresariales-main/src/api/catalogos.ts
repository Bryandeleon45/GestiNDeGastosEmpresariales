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

export function listarDependencias() {
  return api.get<Dependencia[]>("/dependencias")
}

export function listarPuestos() {
  return api.get<Puesto[]>("/puestos")
}
