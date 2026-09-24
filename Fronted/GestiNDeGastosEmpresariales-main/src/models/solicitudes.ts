// ─── Solicitudes model ────────────────────────────────────────────────────────
export type SolPrioridad = "Urgente" | "Media" | "Baja"
export type SolEstado = "En Revisión" | "Aprobado" | "Pagado" | "Pendiente" | "Rechazado"

export interface SolicitudRow {
  id: string
  dep: string
  item: string
  cant: string
  prioridad: SolPrioridad
  estado: SolEstado
  fecha: string
  monto: string
  solicitante: string
  justificacion: string
}

export const ALL_DEPS_SOLICITUDES: SolicitudRow[] = [
  {
    id: "SC-2024-042",
    dep: "Oficina de Agua",
    item: "Cloro Granulado (Hipoclorito de Calcio 65%)",
    cant: "15 Tambos",
    prioridad: "Urgente",
    estado: "En Revisión",
    fecha: "24/05/2024",
    monto: "Q 12,450.00",
    solicitante: "Ing. Carlos Velásquez",
    justificacion: "Mantenimiento urgente de planta de tratamiento de agua.",
  },
  {
    id: "SC-2024-039",
    dep: "Secretaría",
    item: "Papelería y Útiles de Oficina",
    cant: "1 Lote",
    prioridad: "Media",
    estado: "Aprobado",
    fecha: "22/05/2024",
    monto: "Q 3,200.00",
    solicitante: "Lic. Ana González",
    justificacion: "Suministros para operaciones de secretaría mes de mayo.",
  },
  {
    id: "SC-2024-035",
    dep: "DAFIM",
    item: "Tóner para Impresora Láser HP LaserJet 85A",
    cant: "4 Unidades",
    prioridad: "Baja",
    estado: "Pagado",
    fecha: "15/05/2024",
    monto: "Q 1,140.00",
    solicitante: "Lic. Mario Estrada",
    justificacion: "Reposición de tóners para equipos de impresión de DAFIM.",
  },
  {
    id: "SC-2024-041",
    dep: "Oficina de Agua",
    item: "Medidores de Caudal Digitales",
    cant: "6 Unidades",
    prioridad: "Media",
    estado: "Aprobado",
    fecha: "23/05/2024",
    monto: "Q 8,400.00",
    solicitante: "Ing. Carlos Velásquez",
    justificacion: "Reemplazo de medidores obsoletos en red de distribución.",
  },
  {
    id: "SC-2024-040",
    dep: "Obras Públicas",
    item: "Cemento Portland Tipo I (Sacos 42.5 kg)",
    cant: "200 Sacos",
    prioridad: "Urgente",
    estado: "En Revisión",
    fecha: "21/05/2024",
    monto: "Q 18,600.00",
    solicitante: "Ing. Roberto Alvarado",
    justificacion: "Reparación de calles en Barrio Jucanyá. Deterioro crítico.",
  },
  {
    id: "SC-2024-038",
    dep: "Secretaría",
    item: "Sellos y Timbres Notariales",
    cant: "2 Juegos",
    prioridad: "Baja",
    estado: "Pagado",
    fecha: "18/05/2024",
    monto: "Q 850.00",
    solicitante: "Lic. Ana González",
    justificacion:
      "Sellos reglamentarios para documentos oficiales municipales.",
  },
  {
    id: "SC-2024-037",
    dep: "DAFIM",
    item: "Software de Contabilidad Gubernamental (Licencia)",
    cant: "1 Licencia",
    prioridad: "Media",
    estado: "En Revisión",
    fecha: "17/05/2024",
    monto: "Q 6,500.00",
    solicitante: "Lic. Mario Estrada",
    justificacion:
      "Renovación anual de licencia sistema contable institucional.",
  },
  {
    id: "SC-2024-036",
    dep: "Policía Municipal",
    item: "Uniformes Policiales Completos",
    cant: "12 Juegos",
    prioridad: "Media",
    estado: "Aprobado",
    fecha: "16/05/2024",
    monto: "Q 4,800.00",
    solicitante: "Com. Luis Pérez",
    justificacion:
      "Dotación anual de uniformes para agentes de policía municipal.",
  },
  {
    id: "SC-2024-034",
    dep: "Obras Públicas",
    item: "Varilla de Hierro Corrugado 3/8 pulgada",
    cant: "50 Quintales",
    prioridad: "Media",
    estado: "Pagado",
    fecha: "14/05/2024",
    monto: "Q 22,500.00",
    solicitante: "Ing. Roberto Alvarado",
    justificacion: "Material para construcción de muros en zona de riesgo.",
  },
  {
    id: "SC-2024-033",
    dep: "Cultura",
    item: "Sistema de Audio Profesional (Amplificadores)",
    cant: "1 Sistema",
    prioridad: "Baja",
    estado: "Aprobado",
    fecha: "12/05/2024",
    monto: "Q 9,200.00",
    solicitante: "Prof. María Tzul",
    justificacion: "Equipo para eventos culturales y festividades municipales.",
  },
  {
    id: "SC-2024-032",
    dep: "Policía Municipal",
    item: "Vehículo Pickup Doble Cabina 4x4",
    cant: "1 Unidad",
    prioridad: "Urgente",
    estado: "En Revisión",
    fecha: "10/05/2024",
    monto: "Q 185,000.00",
    solicitante: "Com. Luis Pérez",
    justificacion:
      "Reposición de vehículo dañado en servicio. Necesidad urgente.",
  },
  {
    id: "SC-2024-031",
    dep: "DAFIM",
    item: "Archivadores Metálicos de 4 Gavetas",
    cant: "6 Unidades",
    prioridad: "Baja",
    estado: "Pagado",
    fecha: "08/05/2024",
    monto: "Q 3,600.00",
    solicitante: "Lic. Mario Estrada",
    justificacion:
      "Reorganización de archivos documentales departamento DAFIM.",
  },
  {
    id: "SC-2024-030",
    dep: "Oficina de Agua",
    item: "Tubería PVC de 4 pulgadas SDR-26",
    cant: "500 Metros",
    prioridad: "Urgente",
    estado: "Aprobado",
    fecha: "07/05/2024",
    monto: "Q 14,750.00",
    solicitante: "Ing. Carlos Velásquez",
    justificacion:
      "Reposición de red de distribución. Tubería con fugas activas.",
  },
  {
    id: "SC-2024-029",
    dep: "Cultura",
    item: "Disfraces y Vestuario Tradicional Maya",
    cant: "30 Juegos",
    prioridad: "Baja",
    estado: "Pagado",
    fecha: "05/05/2024",
    monto: "Q 6,000.00",
    solicitante: "Prof. María Tzul",
    justificacion: "Vestuario para festival cultural anual Día de la Madre.",
  },
  {
    id: "SC-2024-028",
    dep: "Secretaría",
    item: "Computadoras de Escritorio (Core i5, 8GB RAM)",
    cant: "3 Unidades",
    prioridad: "Media",
    estado: "Aprobado",
    fecha: "03/05/2024",
    monto: "Q 12,900.00",
    solicitante: "Lic. Ana González",
    justificacion:
      "Renovación de equipos de cómputo para personal administrativo.",
  },
]

export const PRIORIDAD_STYLE: Record<SolPrioridad, string> = {
  Urgente: "bg-red-50 text-red-600 border border-red-200",
  Media: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Baja: "bg-gray-100 text-gray-600 border border-gray-200",
}

export const ESTADO_SOL_STYLE: Record<SolEstado, string> = {
  "En Revisión": "bg-sky-50 text-sky-700 border border-sky-200",
  Aprobado: "bg-green-50 text-green-700 border border-green-200",
  Pagado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Pendiente: "bg-gray-100 text-gray-500 border border-gray-200",
  Rechazado: "bg-red-50 text-red-600 border border-red-200",
}

export const ALL_DEPS_NAMES = [
  "Todas las Dependencias",
  "Oficina de Agua",
  "Secretaría",
  "DAFIM",
  "Obras Públicas",
  "Policía Municipal",
  "Cultura",
]
export const SOL_PAGE_SIZE = 5

export const DEPS_LIST = [
  "Oficina de Agua",
  "DAFIM",
  "Secretaría General",
  "Policía Municipal",
  "Obras Públicas",
  "Cultura",
]
