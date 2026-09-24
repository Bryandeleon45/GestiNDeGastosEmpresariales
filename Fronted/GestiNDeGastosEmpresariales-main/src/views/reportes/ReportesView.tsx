import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts"
import {
  MONTHS_REPORT,
  DEPTO_ESTADO_STYLE,
  type DeptoRow,
} from "@/models/reportes"
import FiltrarReportesModal from "@/views/reportes/FiltrarReportesModal"
import { useReportesController } from "@/controllers/useReportesController"

function MultiLineTick({
  x,
  y,
  payload,
}: {
  x?: number
  y?: number
  payload?: { value: string }
}) {
  if (x === undefined || y === undefined || !payload) return null
  const lines = (payload.value ?? "").split("\n")
  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      fill="#9CA3AF"
      fontSize={10}
      fontWeight={600}
    >
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 13}>
          {l}
        </tspan>
      ))}
    </text>
  )
}

export default function ReportesView({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const {
    month,
    setMonth,
    showMonthDD,
    setShowMonthDD,
    showFiltrar,
    setShowFiltrar,
    estadoFilter,
    setEstadoFilter,
    hoveredBar,
    setHoveredBar,
    monthDDRef,
    chartData,
    filteredRows,
  } = useReportesController()

  const fmtQ = (n: number) =>
    `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
  const fmtShort = (n: number) =>
    n >= 1000 ? `Q${(n / 1000).toFixed(0)}k` : `Q${n}`

  const varColor = (depto: DeptoRow) => {
    const diff = ((depto.gasto - depto.presupuesto) / depto.presupuesto) * 100
    if (depto.estado === "Excedido") return "#DC2626"
    if (depto.estado === "Dentro de Límite") return G
    return "#6B7280"
  }
  const varText = (depto: DeptoRow) => {
    const diff = ((depto.gasto - depto.presupuesto) / depto.presupuesto) * 100
    const sign = diff >= 0 ? "+" : ""
    return `${sign}${diff.toFixed(1)}%`
  }

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                Reportes
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Análisis de ejecución presupuestaria y parámetros del sistema.
              </p>
            </div>
            <button
              onClick={() =>
                onToast(
                  "Generando reporte PDF…",
                  "Ejecución Presupuestaria — el archivo se descargará en breve.",
                )
              }
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 shrink-0"
              style={{ backgroundColor: G }}
            >
              <Icons.PDF /> Exportar a PDF
            </button>
          </div>

          <div className="flex gap-4 items-stretch flex-wrap xl:flex-nowrap">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-w-0 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <p className="text-base font-extrabold" style={{ color: G }}>
                  Gasto Mensual por Proveedor
                </p>
                <div className="relative" ref={monthDDRef}>
                  <button
                    onClick={() => setShowMonthDD((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    {month}
                    <svg
                      className="w-3.5 h-3.5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {showMonthDD && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden min-w-[180px]">
                      {MONTHS_REPORT.map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setMonth(m)
                            setShowMonthDD(false)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                          style={{
                            color: month === m ? G : "#374151",
                            fontWeight: month === m ? 700 : 400,
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ height: 240 }}>
                <BarChart
                  data={chartData}
                  width={undefined as unknown as number}
                  height={240}
                  margin={{ top: 8, right: 8, bottom: 32, left: 10 }}
                  style={{ width: "100%" }}
                  className="w-full"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F3F4F6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={<MultiLineTick />}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={fmtShort}
                    tick={{ fontSize: 10, fill: "#9CA3AF", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(30,94,47,0.06)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]
                      return (
                        <div className="bg-gray-900 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg">
                          <p className="text-gray-300 mb-0.5">
                            {(d.payload as { name: string }).name.replace(
                              "\n",
                              " ",
                            )}
                          </p>
                          <p>{fmtQ(d.value as number)}</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={hoveredBar === i ? "#166534" : G}
                        onMouseEnter={() => setHoveredBar(i)}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full xl:w-64 shrink-0">
              <div
                className="rounded-xl p-5 text-white flex flex-col gap-2"
                style={{ backgroundColor: G }}
              >
                <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-75">
                  Total Gasto Mensual
                </p>
                <p className="text-3xl font-extrabold leading-tight font-mono">
                  Q395,750.00
                </p>
                <p className="text-xs opacity-80 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  12.5% respecto al mes anterior
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <p className="text-sm font-extrabold text-gray-900">
                  Eficiencia Presupuestaria
                </p>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: "78%", backgroundColor: G }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span style={{ color: G }}>Ejecutado: 78%</span>
                  <span className="text-gray-400">Restante: 22%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-base font-extrabold text-gray-900">
                Gastos por Departamento
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowFiltrar(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-2 transition-all hover:bg-gray-50"
                  style={{ color: G, borderColor: G }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  {estadoFilter !== "Todos" ? estadoFilter : "Filtrar"}
                </button>
                {estadoFilter !== "Todos" && (
                  <button
                    onClick={() => setEstadoFilter("Todos")}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors hover:bg-red-100 border border-gray-200 text-gray-500"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr
                    className="border-b border-gray-100"
                    style={{ backgroundColor: "#F9FAFB" }}
                  >
                    {[
                      "Departamento",
                      "Responsable",
                      "Presupuesto Asignado",
                      "Gasto Real",
                      "Estado",
                      "Variación",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const es = DEPTO_ESTADO_STYLE[row.estado]
                    const vt = varText(row)
                    const vc = varColor(row)
                    return (
                      <tr
                        key={row.dep}
                        className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-gray-900">
                            {row.dep}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-600">{row.resp}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-700 font-mono">
                            {fmtQ(row.presupuesto)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-extrabold text-gray-900 font-mono">
                            {fmtQ(row.gasto)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: es.bg, color: es.color }}
                          >
                            {row.estado}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p
                            className="text-sm font-extrabold"
                            style={{ color: vc }}
                          >
                            {vt}
                          </p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 py-2">
            © 2023 Municipalidad de Panajachel - Sistema de Auditoría y
            Transparencia
          </p>
        </div>
      </div>

      {showFiltrar && (
        <FiltrarReportesModal
          onClose={() => setShowFiltrar(false)}
          onApply={(v) => setEstadoFilter(v)}
        />
      )}
    </>
  )
}
