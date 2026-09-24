// ─── Facturación model ────────────────────────────────────────────────────────
export type FactEstado = "VENCIDO" | "PENDIENTE" | "PAGADO"

export interface Factura {
  id: string
  num: string
  proveedor: string
  fecha: string
  monto: number
  estado: FactEstado
  nit: string
  concepto: string
  xml: string
}

export const ALL_FACTURAS: Factura[] = [
  {
    id: "f1",
    num: "FEL-49201",
    proveedor: "Suministros Eléctricos S.A.",
    fecha: "25/09/2023",
    monto: 45200,
    estado: "VENCIDO",
    nit: "289301-4",
    concepto: "Material eléctrico para alumbrado",
    xml: "XML-49201",
  },
  {
    id: "f2",
    num: "FEL-38492",
    proveedor: "Constructora del Lago",
    fecha: "01/10/2023",
    monto: 128000,
    estado: "PENDIENTE",
    nit: "102938-4",
    concepto: "Construcción muro perimetral",
    xml: "XML-38492",
  },
  {
    id: "f3",
    num: "FEL-38481",
    proveedor: "Papelería El Centro",
    fecha: "20/09/2023",
    monto: 4150,
    estado: "PAGADO",
    nit: "334455-K",
    concepto: "Suministros de papelería Q3",
    xml: "XML-38481",
  },
  {
    id: "f4",
    num: "FEL-38477",
    proveedor: "Distribuidora Panajachel",
    fecha: "18/09/2023",
    monto: 12800,
    estado: "PAGADO",
    nit: "459823-1",
    concepto: "Distribución de insumos limpieza",
    xml: "XML-38477",
  },
  {
    id: "f5",
    num: "FEL-38455",
    proveedor: "Mantenimiento Global S.A.",
    fecha: "15/09/2023",
    monto: 33000,
    estado: "PENDIENTE",
    nit: "778899-2",
    concepto: "Mantenimiento edificio municipal",
    xml: "XML-38455",
  },
  {
    id: "f6",
    num: "FEL-38400",
    proveedor: "Seguridad Total",
    fecha: "10/09/2023",
    monto: 25000,
    estado: "PAGADO",
    nit: "112233-6",
    concepto: "Servicio mensual de seguridad",
    xml: "XML-38400",
  },
]

export const ESTADO_STYLE: Record<FactEstado, { bg: string color: string }> = {
  VENCIDO: { bg: "#FEE2E2", color: "#DC2626" },
  PENDIENTE: { bg: "#FEF9C3", color: "#854D0E" },
  PAGADO: { bg: "#DCFCE7", color: "#16A34A" },
}

export const MONTHS = ["Octubre 2023", "Noviembre 2023", "Diciembre 2023"]

export interface CalDay {
  d: number
  wk: boolean
  red?: boolean
  cur?: boolean
  dot?: boolean
}

export const CAL_DAYS: CalDay[] = [
  { d: 25, wk: true },
  { d: 26, wk: true },
  { d: 27, wk: true },
  { d: 28, wk: true },
  { d: 29, wk: true },
  { d: 30, wk: false, red: true },
  { d: 1, wk: false, red: true },
  { d: 2, wk: true, cur: true },
  { d: 3, wk: true },
  { d: 4, wk: true },
  { d: 5, wk: true, dot: true },
  { d: 6, wk: true },
  { d: 7, wk: false, red: true },
  { d: 8, wk: false, red: true },
]
