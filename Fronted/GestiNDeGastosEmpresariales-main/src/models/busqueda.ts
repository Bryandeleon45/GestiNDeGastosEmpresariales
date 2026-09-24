// ─── Búsqueda model ───────────────────────────────────────────────────────────
export type SearchResultType = "solicitud" | "proveedor" | "stock"

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  meta: string
  badge: string
  badgeStyle: string
}

export const ALL_SEARCH_RESULTS: SearchResult[] = [
  {
    id: "r1",
    type: "solicitud",
    title: "SOL-2023-458 — DAFIM",
    meta: "Compra de materiales de oficina",
    badge: "Entregado",
    badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "r2",
    type: "solicitud",
    title: "SOL-2023-459 — Secretaría General",
    meta: "Servicio técnico de mantenimiento",
    badge: "Parcial",
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "r3",
    type: "solicitud",
    title: "SOL-2023-460 — Oficina de Agua",
    meta: "Compra de suministros de cloro",
    badge: "Pendiente",
    badgeStyle: "bg-gray-100 text-gray-600 border-gray-200",
  },
  {
    id: "r4",
    type: "solicitud",
    title: "SOL-2023-461 — Policía Municipal",
    meta: "Equipamiento de protección",
    badge: "Entregado",
    badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "r5",
    type: "solicitud",
    title: "SOL-2023-462 — Obras Públicas",
    meta: "Materiales de construcción",
    badge: "Parcial",
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "r6",
    type: "proveedor",
    title: "Librería y Papelería Sololá",
    meta: "Categoría: Insumos de Oficina",
    badge: "Activo",
    badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "r7",
    type: "proveedor",
    title: "TecnoSupplies Guatemala",
    meta: "Categoría: Equipos Tecnológicos",
    badge: "Activo",
    badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "r8",
    type: "proveedor",
    title: "Distribuidora DAFIM",
    meta: "Categoría: Materiales Varios",
    badge: "Activo",
    badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "r9",
    type: "stock",
    title: "Tóner HP LaserJet 85A",
    meta: "5 disponibles · Bodega Central B-05",
    badge: "Stock Bajo",
    badgeStyle: "bg-orange-50 text-orange-600 border-orange-200",
  },
  {
    id: "r10",
    type: "stock",
    title: "Papel Bond A4 (Resmas)",
    meta: "12 disponibles · Bodega Central B-02",
    badge: "CRÍTICO",
    badgeStyle: "bg-red-50 text-red-600 border-red-200",
  },
  {
    id: "r11",
    type: "stock",
    title: "Folder Manila Oficio",
    meta: "250 disponibles · Bodega Central B-01",
    badge: "Stock Bajo",
    badgeStyle: "bg-orange-50 text-orange-600 border-orange-200",
  },
  {
    id: "r12",
    type: "solicitud",
    title: "SOL-2024-047 — Cultura",
    meta: "Insumos culturales y recreativos",
    badge: "Pendiente",
    badgeStyle: "bg-gray-100 text-gray-600 border-gray-200",
  },
]

export const RESULT_TYPE_LABEL: Record<SearchResultType, string> = {
  solicitud: "Solicitudes",
  proveedor: "Proveedores",
  stock: "Inventario",
}
