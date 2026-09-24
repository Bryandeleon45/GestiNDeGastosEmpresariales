// ─── Usuarios model ───────────────────────────────────────────────────────────
export type UserEstado = "Activo" | "Inactivo"

export interface UsuarioRecord {
  id: string
  codigo: string
  nombre: string
  dpi: string
  estado: UserEstado
  telefono: string
  ingreso: string
  tieneAcceso: boolean
}

export const ROLES_SISTEMA = ["Administrador", "Proveedor"]

export const USUARIOS_INIT: UsuarioRecord[] = [
  {
    id: "u1",
    codigo: "USR-001",
    nombre: "Carlos Enrique Pérez López",
    dpi: "2891456302101",
    estado: "Activo",
    telefono: "5551-0201",
    ingreso: "12/03/2018",
    tieneAcceso: true,
  },
  {
    id: "u2",
    codigo: "USR-002",
    nombre: "Ana Lucía Ramírez García",
    dpi: "3012589740301",
    estado: "Activo",
    telefono: "5551-0302",
    ingreso: "07/06/2019",
    tieneAcceso: true,
  },
  {
    id: "u3",
    codigo: "USR-003",
    nombre: "Jorge Alberto Morales Soto",
    dpi: "2741236501801",
    estado: "Activo",
    telefono: "5551-0403",
    ingreso: "15/01/2020",
    tieneAcceso: false,
  },
  {
    id: "u4",
    codigo: "USR-004",
    nombre: "María del Carmen Ajú Batz",
    dpi: "3145678920501",
    estado: "Activo",
    telefono: "5551-0504",
    ingreso: "20/08/2021",
    tieneAcceso: true,
  },
  {
    id: "u5",
    codigo: "USR-005",
    nombre: "Roberto Josué Cojolón Tzul",
    dpi: "2989741236001",
    estado: "Inactivo",
    telefono: "5551-0605",
    ingreso: "03/11/2017",
    tieneAcceso: false,
  },
  {
    id: "u6",
    codigo: "USR-006",
    nombre: "Silvia Esperanza Cholotío Giron",
    dpi: "3056123478901",
    estado: "Activo",
    telefono: "5551-0706",
    ingreso: "18/04/2022",
    tieneAcceso: false,
  },
  {
    id: "u7",
    codigo: "USR-007",
    nombre: "Luis Fernando Tzep Chumil",
    dpi: "2812345690201",
    estado: "Activo",
    telefono: "5551-0807",
    ingreso: "09/09/2020",
    tieneAcceso: true,
  },
  {
    id: "u8",
    codigo: "USR-008",
    nombre: "Diana Patricia Ajanel Quiej",
    dpi: "3201478965401",
    estado: "Inactivo",
    telefono: "5551-0908",
    ingreso: "25/02/2016",
    tieneAcceso: false,
  },
]

export const USER_ESTADO_STYLE: Record<UserEstado, {
  bg: string
  color: string
}> = {
  Activo: { bg: "#DCFCE7", color: "#16A34A" },
  Inactivo: { bg: "#FEE2E2", color: "#DC2626" },
}
