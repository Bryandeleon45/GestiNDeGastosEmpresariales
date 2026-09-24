// ─── Proformas / comparativa model ────────────────────────────────────────────
export interface ProveComparativa {
  id: string
  name: string
  provId: string
  rating: number
  items: { unit: number total: number }[]
  entrega: string
}

export const COMP_ITEMS = [
  { label: "Papel Bond Carta 80g", desc: "Resma de 500 hojas", cant: 50 },
  { label: "Tóner HP Laser 58A", desc: "Original, Negro", cant: 5 },
  { label: "Archivadores de Palanca", desc: "Lomo ancho, azul", cant: 30 },
]

export const COMP_PROVS: ProveComparativa[] = [
  {
    id: "p1",
    name: "Ferretería El Sol",
    provId: "PROV-001",
    rating: 4.8,
    items: [
      { unit: 45, total: 2250 },
      { unit: 850, total: 4250 },
      { unit: 28, total: 840 },
    ],
    entrega: "3 días hábiles",
  },
  {
    id: "p2",
    name: "Distribuidora Panajachel",
    provId: "PROV-045",
    rating: 4.5,
    items: [
      { unit: 42.5, total: 2125 },
      { unit: 890, total: 4450 },
      { unit: 32, total: 960 },
    ],
    entrega: "Inmediata (24 hrs)",
  },
  {
    id: "p3",
    name: "Suministros Lago",
    provId: "PROV-112",
    rating: 4.2,
    items: [
      { unit: 48, total: 2400 },
      { unit: 875, total: 4375 },
      { unit: 25.5, total: 765 },
    ],
    entrega: "5 días hábiles",
  },
]

// best price per item (lowest total)
export const BEST_PER_ITEM = COMP_ITEMS.map((_, i) => {
  const totals = COMP_PROVS.map((p) => p.items[i].total)
  const min = Math.min(...totals)
  return COMP_PROVS.filter((p) => p.items[i].total === min).map((p) => p.id)
})
