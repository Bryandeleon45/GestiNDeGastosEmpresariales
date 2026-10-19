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

export const RESULT_TYPE_LABEL: Record<SearchResultType, string> = {
  solicitud: "Solicitudes",
  proveedor: "Proveedores",
  stock: "Inventario",
}
