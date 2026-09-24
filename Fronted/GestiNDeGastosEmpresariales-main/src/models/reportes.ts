// ─── Reportes model ───────────────────────────────────────────────────────────
export const CHART_DATA_BY_MONTH: Record<string, {
  name: string
  value: number
}[]> = {
  "Octubre 2023": [
    { name: "Construcciones\nPanajachel", value: 142000 },
    { name: "Suministros\nGlobales S.A.", value: 88500 },
    { name: "Ferretería\nEl Lago", value: 65200 },
    { name: "Servicios de\nLimpieza", value: 54300 },
    { name: "Papelería\nProgreso", value: 45750 },
  ],
  "Septiembre 2023": [
    { name: "Construcciones\nPanajachel", value: 118000 },
    { name: "Suministros\nGlobales S.A.", value: 76200 },
    { name: "Ferretería\nEl Lago", value: 59800 },
    { name: "Servicios de\nLimpieza", value: 49100 },
    { name: "Papelería\nProgreso", value: 38400 },
  ],
  "Agosto 2023": [
    { name: "Construcciones\nPanajachel", value: 135000 },
    { name: "Suministros\nGlobales S.A.", value: 92300 },
    { name: "Ferretería\nEl Lago", value: 48700 },
    { name: "Servicios de\nLimpieza", value: 61500 },
    { name: "Papelería\nProgreso", value: 29800 },
  ],
}

export const MONTHS_REPORT = ["Octubre 2023", "Septiembre 2023", "Agosto 2023"]

export type DeptoEstado = "Dentro de Límite" | "Excedido" | "En Proceso"

export interface DeptoRow {
  dep: string
  resp: string
  presupuesto: number
  gasto: number
  estado: DeptoEstado
}

export const DEPTO_ROWS: DeptoRow[] = [
  {
    dep: "Obras Públicas",
    resp: "Ing. Carlos Méndez",
    presupuesto: 500000,
    gasto: 425000,
    estado: "Dentro de Límite",
  },
  {
    dep: "Servicios Públicos",
    resp: "Licda. Elena Soto",
    presupuesto: 250000,
    gasto: 265000,
    estado: "Excedido",
  },
  {
    dep: "Administración",
    resp: "Don Roberto García",
    presupuesto: 150000,
    gasto: 138500,
    estado: "En Proceso",
  },
  {
    dep: "Turismo y Cultura",
    resp: "Sofía Alvarado",
    presupuesto: 80000,
    gasto: 72100,
    estado: "Dentro de Límite",
  },
]

export const DEPTO_ESTADO_STYLE: Record<DeptoEstado, {
  bg: string
  color: string
}> = {
  "Dentro de Límite": { bg: "#DCFCE7", color: "#16A34A" },
  Excedido: { bg: "#FEE2E2", color: "#DC2626" },
  "En Proceso": { bg: "#FEF9C3", color: "#92400E" },
}
