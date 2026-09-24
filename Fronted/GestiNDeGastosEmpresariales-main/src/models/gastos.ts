// ─── Gastos model ─────────────────────────────────────────────────────────────
export interface GastoMes {
  mes: string
  presupuesto: string
  ejecutado: string
  saldo: string
  saldoC: "green" | "red"
  estado: string
}

export const GASTOS_DATA: GastoMes[] = [
  {
    mes: "Enero",
    presupuesto: "Q 50,000.00",
    ejecutado: "Q 42,100.00",
    saldo: "Q 7,900.00",
    saldoC: "green",
    estado: "Dentro de Límite",
  },
  {
    mes: "Febrero",
    presupuesto: "Q 50,000.00",
    ejecutado: "Q 48,500.00",
    saldo: "Q 1,500.00",
    saldoC: "red",
    estado: "Al Límite",
  },
  {
    mes: "Marzo",
    presupuesto: "Q 50,000.00",
    ejecutado: "Q 35,000.00",
    saldo: "Q 15,000.00",
    saldoC: "green",
    estado: "Dentro de Límite",
  },
]

export const ESTADO_BADGE: Record<string, string> = {
  "Dentro de Límite":
    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Al Límite": "bg-orange-50 text-orange-600 border border-orange-200",
}
