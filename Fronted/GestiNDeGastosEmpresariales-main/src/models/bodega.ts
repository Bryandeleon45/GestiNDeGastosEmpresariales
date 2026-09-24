// ─── Bodega model ─────────────────────────────────────────────────────────────
export type VerifState = "RECIBIDO" | "RECHAZADO" | "FALTANTE" | null

export interface RecepcionItem {
  id: string
  name: string
  sku: string
  esperado: string
}

export const OC_ITEMS: RecepcionItem[] = [
  {
    id: "i1",
    name: "Resmas de Papel Bond A4 (75g)",
    sku: "SKU: IN-001-PB",
    esperado: "50 u.",
  },
  {
    id: "i2",
    name: "Marcadores Permanentes (Negro)",
    sku: "SKU: IN-012-MP",
    esperado: "24 u.",
  },
  {
    id: "i3",
    name: "Folders Manilas Oficio",
    sku: "SKU: IN-045-FM",
    esperado: "500 u.",
  },
]

export type HistEstado = "COMPLETO" | "CON RECHAZO"

export interface HistEntry {
  id: string
  fecha: string
  estado: HistEstado
  empresa: string
  oc: string
  detalle: string
  link: string
}

export const HIST_ENTRIES: HistEntry[] = [
  {
    id: "h1",
    fecha: "OCT 24, 2023 · 09:45 AM",
    estado: "COMPLETO",
    empresa: "Suministros Ofimática S.A.",
    oc: "OC-2023-042",
    detalle: "5 ítems recibidos sin novedad.",
    link: "Ver detalles",
  },
  {
    id: "h2",
    fecha: "OCT 22, 2023 · 14:20 PM",
    estado: "CON RECHAZO",
    empresa: "Limpieza Profesional GT",
    oc: "OC-2023-039",
    detalle: "2 Galones de Cloro rechazados por derrame.",
    link: "Ver reporte",
  },
  {
    id: "h3",
    fecha: "OCT 21, 2023 · 11:10 AM",
    estado: "COMPLETO",
    empresa: "Mantenimiento Global",
    oc: "OC-2023-038",
    detalle: "Repuestos para bomba de agua.",
    link: "Ver detalles",
  },
  {
    id: "h4",
    fecha: "OCT 19, 2023 · 08:30 AM",
    estado: "COMPLETO",
    empresa: "Insumos El Lago",
    oc: "OC-2023-035",
    detalle: "12 Baterías de alto rendimiento.",
    link: "Ver detalles",
  },
]
