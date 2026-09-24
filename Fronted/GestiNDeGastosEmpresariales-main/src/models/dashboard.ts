// ─── Dashboard model ──────────────────────────────────────────────────────────
export type ActStatus = "Entregado" | "Parcial" | "Pendiente"

export interface ActividadRow {
  sol: string
  dep: string
  monto: string
  status: ActStatus
}

export const ACTIVITY: ActividadRow[] = [
  {
    sol: "SOL-2023-458",
    dep: "DAFIM",
    monto: "Q 12,450.00",
    status: "Entregado",
  },
  {
    sol: "SOL-2023-459",
    dep: "Secretaría General",
    monto: "Q 3,200.00",
    status: "Parcial",
  },
  {
    sol: "SOL-2023-460",
    dep: "Oficina de Agua",
    monto: "Q 45,900.00",
    status: "Pendiente",
  },
  {
    sol: "SOL-2023-461",
    dep: "Policía Municipal",
    monto: "Q 1,150.00",
    status: "Entregado",
  },
  {
    sol: "SOL-2023-462",
    dep: "Obras Públicas",
    monto: "Q 78,200.00",
    status: "Parcial",
  },
]

export const STATUS_BADGE: Record<ActStatus, string> = {
  Entregado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Parcial: "bg-amber-50 text-amber-700 border border-amber-200",
  Pendiente: "bg-gray-100 text-gray-600 border border-gray-200",
}

export interface StockItem {
  id: string
  name: string
  pct: number
  level: "CRÍTICO" | "BAJO"
  disp: number
  min: number
  unit: string
  lastRestock: string
  location: string
  proveedor: string
  costo: string
}

export const STOCK: StockItem[] = [
  {
    id: "s1",
    name: "Papel Bond A4 (Resmas)",
    pct: 12,
    level: "CRÍTICO",
    disp: 12,
    min: 100,
    unit: "Resmas",
    lastRestock: "15/03/2026",
    location: "Bodega Central B-02",
    proveedor: "Papelería El Sol",
    costo: "Q 45.00 / resma",
  },
  {
    id: "s2",
    name: "Tóner HP LaserJet 85A",
    pct: 33,
    level: "BAJO",
    disp: 5,
    min: 15,
    unit: "Unidades",
    lastRestock: "01/04/2026",
    location: "Bodega Central B-05",
    proveedor: "TecnoSupplies GT",
    costo: "Q 285.00 / unidad",
  },
  {
    id: "s3",
    name: "Folder Manila Oficio",
    pct: 50,
    level: "BAJO",
    disp: 250,
    min: 500,
    unit: "Piezas",
    lastRestock: "20/04/2026",
    location: "Bodega Central B-01",
    proveedor: "Distribuidora DAFIM",
    costo: "Q 1.50 / pieza",
  },
]
