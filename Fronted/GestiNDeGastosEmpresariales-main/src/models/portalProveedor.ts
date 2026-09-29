// ─── Portal de Proveedores model ──────────────────────────────────────────────
export type SupplierNav = "oportunidades" | "ordenes" | "entregas" | "configuracion"
export type SolEstadoProv = "En Licitación" | "Cotización Enviada" | "Adjudicado"

export const SOL_ESTADO_PROV: Record<SolEstadoProv, {
  bg: string
  color: string
}> = {
  "En Licitación": { bg: "#E0F2FE", color: "#0284C7" },
  "Cotización Enviada": { bg: "#DCFCE7", color: "#16A34A" },
  Adjudicado: { bg: "#22C55E", color: "#FFFFFF" },
}

export interface SolProv {
  id: string
  num: string
  cat: string
  limite: string
  presupuesto: string
  estado: SolEstadoProv
}

export const SOL_PROV: SolProv[] = [
  {
    id: "s1",
    num: "#SOL-2026-089",
    cat: "Suministros de Oficina",
    limite: "28/08/2026",
    presupuesto: "Q 12,500.00",
    estado: "En Licitación",
  },
  {
    id: "s2",
    num: "#SOL-2026-084",
    cat: "Materiales de Construcción",
    limite: "30/08/2026",
    presupuesto: "Q 45,000.00",
    estado: "Cotización Enviada",
  },
  {
    id: "s3",
    num: "#SOL-2026-078",
    cat: "Repuestos de Maquinaria",
    limite: "15/08/2026",
    presupuesto: "Q 8,200.00",
    estado: "Adjudicado",
  },
]

export const ORDENES_PROV = [
  {
    oc: "OC-2026-042",
    desc: "Suministros de limpieza",
    monto: "Q 8,400.00",
    estado: "Pagado",
    fecha: "12/08/2026",
  },
  {
    oc: "OC-2026-038",
    desc: "Papelería y suministros",
    monto: "Q 12,100.00",
    estado: "Pendiente",
    fecha: "25/08/2026",
  },
  {
    oc: "OC-2026-031",
    desc: "Repuestos eléctricos",
    monto: "Q 64,900.00",
    estado: "En Proceso",
    fecha: "30/08/2026",
  },
]

export const ENTREGAS_PROV = [
  {
    oc: "OC-2026-042",
    items: "12 cajas papelería",
    fecha: "14/08/2026 09:00",
    estado: "Programada",
    bodeguero: "Enc. Ramírez",
  },
  {
    oc: "OC-2026-031",
    items: "Caja repuestos x4",
    fecha: "18/08/2026 14:00",
    estado: "Completada",
    bodeguero: "Enc. López",
  },
  {
    oc: "OC-2026-028",
    items: "Suministros limpieza",
    fecha: "20/08/2026 10:30",
    estado: "Pendiente",
    bodeguero: "Por asignar",
  },
]

export interface PortalKpi {
  key: string
  label: string
  value: string
  sub2: string
  subColor?: string
}

export const PORTAL_KPIS: PortalKpi[] = [
  { key: "cotizaciones", label: "COTIZACIONES ENVIADAS", value: "18", sub2: "4 en revisión técnica" },
  { key: "adjudicadas", label: "ÓRDENES ADJUDICADAS", value: "05", sub2: "Q 85,400.00 en ejecución", subColor: "#1E5E2F" },
  { key: "facturas", label: "FACTURAS PENDIENTES", value: "02", sub2: "Próximo pago: 25/08/2026", subColor: "#D97706" },
]
