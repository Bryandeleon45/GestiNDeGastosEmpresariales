// ─── Proveedores model ────────────────────────────────────────────────────────
export type ConexionEstado = "Conectado" | "Sin Conexión" | "Acceso Bloqueado"
export type ProvRol = "Proveedor Premium" | "Proveedor Estándar" | "Distribuidor Mayorista" | "Bloqueado"

export interface Proveedor {
  id: string
  initials: string
  avatarColor: string
  name: string
  nit: string
  rol: ProvRol
  estado: ConexionEstado
  ultimaActividad: string
  email: string
  telefono: string
  categoria: string
}

export const PROV_ROLES: ProvRol[] = [
  "Proveedor Estándar",
  "Proveedor Premium",
  "Distribuidor Mayorista",
  "Bloqueado",
]

export const ALL_PROVEEDORES: Proveedor[] = [
  {
    id: "p1",
    initials: "SL",
    avatarColor: "#D1FAE5",
    name: "Suministros El Lago",
    nit: "459823-1",
    rol: "Proveedor Premium",
    estado: "Conectado",
    ultimaActividad: "Hoy, 10:24 AM",
    email: "contacto@sumlagο.gt",
    telefono: "7762-1100",
    categoria: "Insumos Generales",
  },
  {
    id: "p2",
    initials: "FS",
    avatarColor: "#D1FAE5",
    name: "Ferretería El Sol",
    nit: "102938-4",
    rol: "Proveedor Estándar",
    estado: "Sin Conexión",
    ultimaActividad: "Hace 3 días",
    email: "ventas@ferresol.gt",
    telefono: "7762-4421",
    categoria: "Ferretería y Construcción",
  },
  {
    id: "p3",
    initials: "DM",
    avatarColor: "#D1FAE5",
    name: "Distribuidora Maya",
    nit: "882736-2",
    rol: "Distribuidor Mayorista",
    estado: "Conectado",
    ultimaActividad: "Ayer, 04:15 PM",
    email: "pedidos@distmaya.gt",
    telefono: "7762-8830",
    categoria: "Distribución General",
  },
  {
    id: "p4",
    initials: "CC",
    avatarColor: "#F3F4F6",
    name: "Construcciones del Centro",
    nit: "554433-K",
    rol: "Proveedor Premium",
    estado: "Acceso Bloqueado",
    ultimaActividad: "21 Oct, 2023",
    email: "info@constrcentro.gt",
    telefono: "7762-5591",
    categoria: "Construcción",
  },
  {
    id: "p5",
    initials: "PS",
    avatarColor: "#D1FAE5",
    name: "Papelería y Suministros GT",
    nit: "331209-7",
    rol: "Proveedor Estándar",
    estado: "Conectado",
    ultimaActividad: "Hoy, 08:15 AM",
    email: "ventas@papelgt.com",
    telefono: "7762-3302",
    categoria: "Papelería",
  },
  {
    id: "p6",
    initials: "TG",
    avatarColor: "#D1FAE5",
    name: "TecnoSupplies Guatemala",
    nit: "778812-3",
    rol: "Proveedor Estándar",
    estado: "Sin Conexión",
    ultimaActividad: "Hace 1 semana",
    email: "soporte@tecnogt.com",
    telefono: "2338-7700",
    categoria: "Tecnología",
  },
  {
    id: "p7",
    initials: "AG",
    avatarColor: "#D1FAE5",
    name: "Agroservicios del Lago",
    nit: "215544-8",
    rol: "Distribuidor Mayorista",
    estado: "Conectado",
    ultimaActividad: "Hace 2 días",
    email: "pedidos@agrolago.gt",
    telefono: "7762-0091",
    categoria: "Agropecuario",
  },
  {
    id: "p8",
    initials: "ME",
    avatarColor: "#D1FAE5",
    name: "Muebles y Equipos S.A.",
    nit: "664431-2",
    rol: "Proveedor Estándar",
    estado: "Conectado",
    ultimaActividad: "Hace 4 días",
    email: "ventas@muebequipos.gt",
    telefono: "7762-1198",
    categoria: "Mobiliario",
  },
  {
    id: "p9",
    initials: "LQ",
    avatarColor: "#FEF3C7",
    name: "Lubricantes y Químicos Xela",
    nit: "992210-5",
    rol: "Proveedor Estándar",
    estado: "Sin Conexión",
    ultimaActividad: "Hace 2 semanas",
    email: "quimicos@lqxela.com",
    telefono: "7761-4422",
    categoria: "Químicos",
  },
  {
    id: "p10",
    initials: "SP",
    avatarColor: "#D1FAE5",
    name: "Servicios Profesionales GT",
    nit: "119876-4",
    rol: "Proveedor Premium",
    estado: "Conectado",
    ultimaActividad: "Hoy, 09:40 AM",
    email: "servicios@spgt.com.gt",
    telefono: "2234-9900",
    categoria: "Servicios",
  },
  {
    id: "p11",
    initials: "RB",
    avatarColor: "#FEE2E2",
    name: "Repuestos y Bocinas Sololá",
    nit: "441122-9",
    rol: "Bloqueado",
    estado: "Acceso Bloqueado",
    ultimaActividad: "12 Sep, 2023",
    email: "repuestos@rbsolola.gt",
    telefono: "7762-5500",
    categoria: "Automotriz",
  },
  {
    id: "p12",
    initials: "EC",
    avatarColor: "#D1FAE5",
    name: "Electrónica y Comunicaciones",
    nit: "663300-1",
    rol: "Proveedor Estándar",
    estado: "Conectado",
    ultimaActividad: "Ayer, 02:00 PM",
    email: "electronica@ecgt.com.gt",
    telefono: "2244-1133",
    categoria: "Electrónica",
  },
]

export const CONEXION_STYLE: Record<ConexionEstado, {
  bg: string
  text: string
  dot: string
}> = {
  Conectado: { bg: "#DCFCE7", text: "#16A34A", dot: "#16A34A" },
  "Sin Conexión": { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
  "Acceso Bloqueado": { bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
}

export const PROV_PAGE_SIZE = 4

export const PROV_CATEGORIAS = [
  "Insumos Generales",
  "Ferretería y Construcción",
  "Papelería",
  "Tecnología",
  "Distribución General",
  "Agropecuario",
  "Mobiliario",
  "Químicos",
  "Servicios",
  "Automotriz",
  "Electrónica",
  "Construcción",
]
