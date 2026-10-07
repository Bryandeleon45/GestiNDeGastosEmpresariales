import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import KpiCard from "@/views/common/KpiCard"
import BrandingCard from "@/views/dashboard/BrandingCard"
import SupportCard from "@/views/dashboard/SupportCard"
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
import { useDashboardController } from "@/controllers/useDashboardController"

const PIE_COLORS = ["#1E5E2F", "#0EA5E9", "#D97706", "#DC2626", "#7C3AED", "#64748B"]

const ESTADO_BADGE: Record<string, string> = {
  Pendiente: "bg-gray-100 text-gray-600 border border-gray-200",
  "En Revisión": "bg-sky-50 text-sky-700 border border-sky-200",
  Aprobada: "bg-green-50 text-green-700 border border-green-200",
  Rechazada: "bg-red-50 text-red-600 border border-red-200",
  "En Compra": "bg-purple-50 text-purple-700 border border-purple-200",
  Cancelada: "bg-slate-50 text-slate-500 border border-slate-200",
}

const fmtQ = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

const fmtShort = (n: number) => (n >= 1000 ? `Q${(n / 1000).toFixed(0)}k` : `Q${n}`)

function fmtFecha(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-GT")
}

export default function DashboardView({
  onToast,
  onNav,
  onOpenMap,
  onOpenTicket,
}: {
  onToast: (m: string, s: string) => void
  onNav: (key: string) => void
  onOpenMap: () => void
  onOpenTicket: () => void
}) {
  const { kpis, comprasDep, solicitudesEstado, alertas, actividad, cargar } =
    useDashboardController()

  return (
    <div className="flex-1 overflow-auto p-5" style={{ background: "#F8F9FA" }}>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
            Panel de Control
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Centro de monitoreo de la cadena de suministro municipal.
          </p>
        </div>
        <button
          onClick={() => cargar()}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all hover:bg-gray-50"
          style={{ color: G, borderColor: "#D1D5DB" }}
        >
          <Icons.Refresh /> Actualizar
        </button>
      </div>

      <div className="flex gap-5 min-h-full">
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Total Solicitudes"
              value={String(kpis?.total_solicitudes ?? 0)}
              sub="En el período"
              icon={<Icons.Solicitudes />}
            />
            <KpiCard
              title="Solicitudes Pendientes"
              value={String(kpis?.solicitudes_pendientes ?? 0)}
              sub={`${kpis?.solicitudes_urgentes ?? 0} urgentes`}
              subColor="text-amber-600"
              icon={<Icons.Info />}
            />
            <KpiCard
              title="Órdenes Pendientes"
              value={String(kpis?.ordenes_pendientes ?? 0)}
              sub="Por aprobar o enviar"
              icon={<Icons.Proformas />}
            />
            <KpiCard
              title="Insumos Bajo Mínimo"
              value={String(kpis?.insumos_bajo_minimo ?? 0)}
              sub="Requieren reposición"
              subColor="text-red-600"
              icon={<Icons.Warning />}
            />
            <KpiCard
              title="Entregas Parciales"
              value={String(kpis?.entregas_parciales ?? 0)}
              sub="Recepciones con novedades"
              icon={<Icons.Bodega />}
            />
            <KpiCard
              title="Facturas por Pagar"
              value={String(kpis?.facturas_por_pagar ?? 0)}
              sub="Pendientes de pago"
              subColor="text-amber-600"
              icon={<Icons.Facturacion />}
            />
            <KpiCard
              title="Vales Pendientes"
              value={String(kpis?.vales_pendientes ?? 0)}
              sub="Por autorizar"
              icon={<Icons.Doc />}
            />
            <KpiCard
              title="Compras Comprometidas"
              value={fmtQ(kpis?.compras_comprometidas ?? 0)}
              sub="Total de órdenes activas"
              icon={<Icons.Wallet />}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">Compras por Dependencia</h2>
              {comprasDep.length > 0 ? (
                <div style={{ height: 240 }}>
                  <BarChart data={comprasDep} width={undefined as unknown as number} height={240} margin={{ top: 8, right: 8, bottom: 40, left: 10 }} style={{ width: "100%" }} className="w-full">
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
                <p className="text-xs text-gray-400 py-10 text-center">Sin compras registradas.</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">Solicitudes por Estado</h2>
              {solicitudesEstado.length > 0 ? (
                <div style={{ height: 240 }}>
                  <PieChart width={undefined as unknown as number} height={240} style={{ width: "100%" }} className="w-full">
                    <Pie data={solicitudesEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                      {solicitudesEstado.map((_, i) => (
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

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Actividad Reciente</h2>
              <button onClick={() => onNav("reportes")} className="text-sm font-semibold transition-colors hover:opacity-70" style={{ color: G }}>
                Ver Todo
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["NO. SOLICITUD", "DEPENDENCIA", "MONTO", "ESTADO", "FECHA"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {actividad.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">Sin actividad reciente.</td>
                    </tr>
                  ) : (
                    actividad.map((row) => (
                      <tr key={row.codigo_requisicion} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 font-mono">{row.codigo_requisicion}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-700">{row.nombre_dependencia}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 font-mono whitespace-nowrap">{fmtQ(row.monto)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ESTADO_BADGE[row.estado] ?? "bg-gray-100 text-gray-600"}`}>
                            {row.estado}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap font-mono">{fmtFecha(row.fecha_solicitud)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-60 shrink-0 flex-col gap-4 hidden lg:flex">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center gap-2 px-5 pt-5 pb-4">
              <Icons.Warning />
              <h3 className="text-base font-bold text-gray-900 leading-none">Alertas de Stock Bajo</h3>
              {alertas && alertas.stock.length > 0 && (
                <span className="ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 shrink-0">
                  {alertas.stock.length}
                </span>
              )}
            </div>
            <div className="h-px bg-gray-100 mx-5" />
            <div className="px-5 py-3 space-y-0">
              {!alertas || alertas.stock.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">Sin alertas de stock.</p>
              ) : (
                alertas.stock.map((s, i) => (
                  <div key={s.codigo_insumo}>
                    <div className="py-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-sm font-bold text-gray-900 leading-tight">{s.nombre}</p>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-red-600 shrink-0">
                          {s.stock_actual < s.stock_minimo * 0.5 ? "Crítico" : "Bajo"}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(5, Math.min(100, (s.stock_actual / s.stock_minimo) * 100))}%`,
                            backgroundColor: s.stock_actual < s.stock_minimo * 0.5 ? "#EF4444" : "#F59E0B",
                          }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-gray-700">Disp: <b>{s.stock_actual}</b></span>
                        <span className="text-[11px] text-gray-500">Mín: <b>{s.stock_minimo}</b></span>
                      </div>
                    </div>
                    {i < alertas.stock.length - 1 && <div className="h-px bg-gray-100" />}
                  </div>
                ))
              )}
            </div>
            <div className="px-5 pb-5 pt-2">
              <button
                onClick={() => onNav("bodega")}
                className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                style={{ color: G, borderColor: G }}
              >
                Ir a Bodega
              </button>
            </div>
          </div>
          <BrandingCard onOpenMap={onOpenMap} />
          <SupportCard onOpenTicket={onOpenTicket} />
        </div>
      </div>
    </div>
  )
}
