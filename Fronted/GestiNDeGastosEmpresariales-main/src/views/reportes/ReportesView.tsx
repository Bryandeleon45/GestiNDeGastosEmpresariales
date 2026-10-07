import { useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { useReportesController } from "@/controllers/useReportesController"

const CATEGORIA_STYLE: Record<string, string> = {
  "Inventario y Kardex": "bg-green-50 text-green-700 border border-green-200",
  Compras: "bg-sky-50 text-sky-700 border border-sky-200",
  Ejecutivos: "bg-purple-50 text-purple-700 border border-purple-200",
}

const PIE_COLORS = ["#1E5E2F", "#0EA5E9", "#D97706", "#DC2626", "#7C3AED", "#64748B"]

const fmtQ = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

const fmtShort = (n: number) =>
  n >= 1000 ? `Q${(n / 1000).toFixed(0)}k` : `Q${n}`

export default function ReportesView({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const {
    catalogo,
    opciones,
    resumen,
    codigo,
    data,
    filtros,
    loading,
    seleccionar,
    aplicarFiltros,
    exportar,
  } = useReportesController(onToast)

  const [fi, setFi] = useState("")
  const [ff, setFf] = useState("")
  const [dim, setDim] = useState("")

  const reporte = catalogo.find((c) => c.codigo === codigo) ?? null

  const dimTipo: "dependencia" | "proveedor" | "categoria" | "insumo" | null =
    codigo === "RPT-01"
      ? "insumo"
      : codigo === "RPT-02"
        ? "categoria"
        : codigo === "RPT-04" || codigo === "RPT-05"
          ? "dependencia"
          : codigo === "RPT-06" || codigo === "RPT-08" || codigo === "RPT-09"
            ? "proveedor"
            : null

  const dimOptions =
    dimTipo === "dependencia"
      ? (opciones?.dependencias ?? []).map((d) => ({ id: d.id_dependencia, label: d.nombre_dependencia }))
      : dimTipo === "proveedor"
        ? (opciones?.proveedores ?? []).map((p) => ({ id: p.id_proveedor, label: p.razon_social }))
        : dimTipo === "categoria"
          ? (opciones?.categorias ?? []).map((c) => ({ id: c.id_categoria, label: c.nombre }))
          : dimTipo === "insumo"
            ? (opciones?.insumos ?? []).map((i) => ({ id: i.id_insumo, label: `${i.codigo_insumo} · ${i.nombre}` }))
            : []

  const aplicar = () => {
    const f: Record<string, string | number> = {}
    if (fi) f.fechaInicio = fi
    if (ff) f.fechaFin = ff
    if (dim && dimTipo) {
      if (dimTipo === "dependencia") f.idDependencia = Number(dim)
      else if (dimTipo === "proveedor") f.idProveedor = Number(dim)
      else if (dimTipo === "categoria") f.idCategoria = Number(dim)
      else if (dimTipo === "insumo") f.idInsumo = Number(dim)
    }
    aplicarFiltros(f)
  }

  const kpiCards = resumen?.totales
    ? [
        { label: "Solicitudes", value: String(resumen.totales.solicitudes), icon: <Icons.Solicitudes />, color: G },
        { label: "Órdenes de Compra", value: String(resumen.totales.ordenes), icon: <Icons.Doc />, color: "#0EA5E9" },
        { label: "Comprometido", value: fmtQ(resumen.totales.comprometido), icon: <Icons.Wallet />, color: "#D97706" },
        { label: "Adjudicado", value: fmtQ(resumen.totales.adjudicado), icon: <Icons.CheckBadge />, color: "#16A34A" },
        { label: "Insumos", value: String(resumen.totales.insumos), icon: <Icons.Boxes />, color: "#7C3AED" },
        { label: "Stock Total", value: String(resumen.totales.stock_total), icon: <Icons.Bodega />, color: "#DC2626" },
      ]
    : []

  const solEstado = resumen?.extra?.solicitudes_por_estado ?? []

  return (
    <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
      <div className="px-6 py-5 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">Reportes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Análisis e informes ejecutivos de compras, inventario y auditoría.
            </p>
          </div>
          {reporte && (
            <button
              onClick={exportar}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 shrink-0"
              style={{ backgroundColor: G }}
            >
              <Icons.Download /> Exportar CSV
            </button>
          )}
        </div>

        {/* ── Panel de estadísticas (resumen ejecutivo) ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
              <Icons.Activity />
            </div>
            <div>
              <p className="text-base font-extrabold text-gray-900">Estado General del Almacén</p>
              <p className="text-xs text-gray-500">Resumen en tiempo real de la cadena de suministro.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
            {kpiCards.map((k) => (
              <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${k.color}18`, color: k.color }}>
                    {k.icon}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">{k.label}</p>
                </div>
                <p className="text-xl font-extrabold text-gray-900 font-mono leading-none">{k.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-sm font-extrabold text-gray-900 mb-3">Gasto por Proveedor</p>
              {resumen?.grafico && resumen.grafico.length > 0 ? (
                <div style={{ height: 260 }}>
                  <BarChart data={resumen.grafico} width={undefined as unknown as number} height={260} margin={{ top: 8, right: 8, bottom: 40, left: 10 }} style={{ width: "100%" }} className="w-full">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} angle={-20} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(30,94,47,0.06)" }} content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="bg-gray-900 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg">
                          <p className="text-gray-300 mb-0.5">{payload[0].payload.name}</p>
                          <p>{fmtQ(payload[0].value as number)}</p>
                        </div>
                      )
                    }} />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]} fill={G} />
                  </BarChart>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-10 text-center">Sin datos de compras.</p>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-sm font-extrabold text-gray-900 mb-3">Solicitudes por Estado</p>
              {solEstado.length > 0 ? (
                <div style={{ height: 260 }}>
                  <PieChart width={undefined as unknown as number} height={260} style={{ width: "100%" }} className="w-full">
                    <Pie data={solEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {solEstado.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="bg-gray-900 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg">
                          <p>{payload[0].name}: {payload[0].value}</p>
                        </div>
                      )
                    }} />
                  </PieChart>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-10 text-center">Sin solicitudes registradas.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Catálogo ── */}
        {!reporte && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Catálogo de Reportes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {catalogo.map((c) => (
                <button
                  key={c.codigo}
                  onClick={() => seleccionar(c.codigo)}
                  className="text-left bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold font-mono text-gray-400">{c.codigo}</p>
                      <p className="text-base font-extrabold text-gray-900 mt-1">{c.titulo}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${CATEGORIA_STYLE[c.categoria] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {c.categoria}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{c.descripcion}</p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs font-bold" style={{ color: G }}>
                    Ver reporte <Icons.ArrowRight />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Visor de reporte ── */}
        {reporte && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { seleccionar(null); setFi(""); setFf(""); setDim("") }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
              >
                <Icons.ChevLeft /> Volver al catálogo
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <p className="text-[10px] font-bold font-mono text-gray-400">{reporte.codigo}</p>
                  <h2 className="text-lg font-extrabold text-gray-900">{reporte.titulo}</h2>
                </div>
              </div>

              <div className="flex items-end gap-3 flex-wrap mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Desde</label>
                  <input type="date" value={fi} onChange={(e) => setFi(e.target.value)} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hasta</label>
                  <input type="date" value={ff} onChange={(e) => setFf(e.target.value)} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600" />
                </div>
                {dimTipo && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {dimTipo === "dependencia" ? "Dependencia" : dimTipo === "proveedor" ? "Proveedor" : dimTipo === "categoria" ? "Categoría" : "Insumo"}
                    </label>
                    <select value={dim} onChange={(e) => setDim(e.target.value)} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 min-w-[200px]">
                      <option value="">Todos</option>
                      {dimOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button onClick={aplicar} className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90" style={{ backgroundColor: G }}>
                  Aplicar Filtros
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-gray-100" style={{ backgroundColor: "#F9FAFB" }}>
                      {(data?.columnas ?? []).map((c) => (
                        <th key={c.campo} className="px-4 py-3 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                          {c.titulo}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={data?.columnas.length ?? 1} className="px-4 py-12 text-center text-sm text-gray-400">Cargando reporte…</td></tr>
                    ) : !data || !data.filas || data.filas.length === 0 ? (
                      <tr><td colSpan={data?.columnas.length ?? 1} className="px-4 py-12 text-center text-sm text-gray-400">Sin datos para los filtros aplicados.</td></tr>
                    ) : (
                      data.filas.map((f, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition-colors">
                          {(data.columnas ?? []).map((c) => {
                            const v = f[c.campo]
                            const esMonto = c.campo.includes("monto") || c.campo === "value"
                            return (
                              <td key={c.campo} className="px-4 py-3">
                                <p className={`text-sm ${esMonto ? "font-extrabold font-mono text-gray-900" : "text-gray-700"}`}>
                                  {esMonto && typeof v === "number" ? fmtQ(v) : (v ?? "—")}
                                </p>
                              </td>
                            )
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
