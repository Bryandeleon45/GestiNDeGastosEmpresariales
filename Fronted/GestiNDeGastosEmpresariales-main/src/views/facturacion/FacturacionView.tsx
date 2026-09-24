import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  ALL_FACTURAS,
  ESTADO_STYLE,
  MONTHS,
  CAL_DAYS,
} from "@/models/facturacion"
import NuevaOrdenModal from "@/views/facturacion/NuevaOrdenModal"
import FacturaDrawer from "@/views/facturacion/FacturaDrawer"
import { useFacturacionController } from "@/controllers/useFacturacionController"

export default function FacturacionView({
  onToast,
  onNav,
}: {
  onToast: (m: string, s: string) => void
  onNav: (k: string) => void
}) {
  const {
    showNuevaOrden,
    setShowNuevaOrden,
    selectedFactura,
    setSelectedFactura,
    estadoFilter,
    setEstadoFilter,
    showEstadoDD,
    setShowEstadoDD,
    isDragging,
    setIsDragging,
    calMonth,
    setCalMonth,
    estadoDDRef,
    filtered,
  } = useFacturacionController()

  const fmt = (n: number) =>
    `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                Facturación y Órdenes de Pago
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestión administrativa de compromisos financieros municipales.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() =>
                  onToast(
                    "Exportando reporte…",
                    "El archivo se descargará en breve.",
                  )
                }
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all hover:bg-gray-50"
                style={{ color: G, borderColor: G }}
              >
                <Icons.PDF /> Exportar Reporte
              </button>
              <button
                onClick={() => setShowNuevaOrden(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90"
                style={{ backgroundColor: G }}
              >
                <Icons.Plus /> Nueva Orden de Pago
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-tight">
                  Total por Pagar
                  <br />
                  (Mes)
                </p>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: GL }}
                >
                  <Icons.Facturacion />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900 mt-3 font-mono leading-none">
                Q<br />
                1,245,800.50
              </p>
              <p className="text-xs font-bold mt-1.5" style={{ color: G }}>
                ↑ +12% vs mes anterior
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  Facturas
                  <br />
                  Pendientes
                </p>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: GL }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke={G}
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-extrabold text-gray-900 mt-3 font-mono">
                42
              </p>
              <p className="text-xs text-gray-500 mt-1.5">
                15 en revisión técnica
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  Vencimientos
                  <br />
                  Próximos
                </p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-50">
                  <svg
                    className="w-4 h-4 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="M17 16l-3-3-3 3" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-extrabold font-mono mt-3 text-red-600">
                08
              </p>
              <p className="text-xs font-semibold text-red-500 mt-1.5">
                Requiere acción inmediata
              </p>
            </div>
            <div
              className="rounded-xl text-white px-5 py-4 flex flex-col gap-3"
              style={{ backgroundColor: G }}
            >
              <p className="text-sm font-extrabold leading-none">
                Portal de Proveedores
              </p>
              <p className="text-xs opacity-80 leading-relaxed">
                Carga digital de facturas y documentos de soporte para agilizar
                procesos.
              </p>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  onToast(
                    "Factura subida con éxito",
                    "El documento fue recibido y está en proceso de validación.",
                  )
                }}
                onClick={() =>
                  onToast(
                    "Factura subida con éxito",
                    "El documento fue recibido y está en proceso de validación.",
                  )
                }
                className="flex-1 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-3 cursor-pointer transition-all"
                style={{
                  borderColor: isDragging
                    ? "#FFFFFF"
                    : "rgba(255,255,255,0.45)",
                  backgroundColor: isDragging
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.08)",
                }}
              >
                <svg
                  className="w-7 h-7 opacity-80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                </svg>
                <p className="text-[10px] font-semibold text-center opacity-80 leading-tight">
                  Arrastra o selecciona
                  <br />
                  archivos PDF/XML
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-5 items-start flex-wrap xl:flex-nowrap">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 w-full xl:w-64 shrink-0">
              <p className="text-base font-extrabold text-gray-900 mb-3">
                Cronograma de Pagos
              </p>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCalMonth((m) => Math.max(0, m - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all text-gray-500"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="text-xs font-bold text-gray-700">
                  {MONTHS[calMonth]}
                </span>
                <button
                  onClick={() =>
                    setCalMonth((m) => Math.min(MONTHS.length - 1, m + 1))
                  }
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all text-gray-500"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                  <div
                    key={`${d}-${i}`}
                    className="text-center text-[10px] font-bold text-gray-400 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {CAL_DAYS.map((day, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all cursor-default
                      ${
                        day.cur
                          ? "text-white"
                          : day.red
                            ? "text-red-500"
                            : "text-gray-600 hover:bg-gray-100"
                      }`}
                      style={day.cur ? { backgroundColor: G } : {}}
                    >
                      {day.d}
                    </div>
                    {day.dot && (
                      <span
                        className="w-1 h-1 rounded-full mt-0.5"
                        style={{ backgroundColor: G }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2.5 mt-4">
                <div className="rounded-lg px-3 py-2.5 border-l-4 border-red-400 bg-red-50">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <svg
                      className="w-3.5 h-3.5 text-red-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <p className="text-[11px] font-extrabold text-red-600">
                      Vence Mañana
                    </p>
                  </div>
                  <p className="text-[11px] text-red-700 leading-snug">
                    Suministros Eléctricos S.A.
                  </p>
                  <p className="text-[11px] font-bold text-red-600">
                    Q 45,200.00
                  </p>
                </div>
                <div
                  className="rounded-lg px-3 py-2.5 border-l-4 bg-emerald-50"
                  style={{ borderColor: G }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <svg
                      className="w-3.5 h-3.5 shrink-0"
                      fill="none"
                      stroke={G}
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p
                      className="text-[11px] font-extrabold"
                      style={{ color: G }}
                    >
                      Pago Programado (Oct 05)
                    </p>
                  </div>
                  <p
                    className="text-[11px] leading-snug"
                    style={{ color: "#166534" }}
                  >
                    Constructora del Lago
                  </p>
                  <p className="text-[11px] font-bold" style={{ color: G }}>
                    Q 128,000.00
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 flex-wrap">
                <p className="text-base font-extrabold text-gray-900">
                  Historial de Facturas y Pagos
                </p>
                <div className="relative" ref={estadoDDRef}>
                  <button
                    onClick={() => setShowEstadoDD((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    {estadoFilter === "Todos"
                      ? "Todos los estados"
                      : estadoFilter}
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {showEstadoDD && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden min-w-[160px]">
                      {([
                        "Todos",
                        "PAGADO",
                        "PENDIENTE",
                        "VENCIDO",
                      ] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setEstadoFilter(opt as typeof estadoFilter)
                            setShowEstadoDD(false)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                          style={{
                            color: estadoFilter === opt ? G : "#374151",
                            fontWeight: estadoFilter === opt ? 700 : 400,
                          }}
                        >
                          {opt === "Todos" ? "Todos los estados" : opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px]">
                  <thead>
                    <tr
                      className="border-b border-gray-100"
                      style={{ backgroundColor: "#F9FAFB" }}
                    >
                      {[
                        "NO. FACTURA",
                        "PROVEEDOR",
                        "FECHA EMISIÓN",
                        "MONTO",
                        "ESTADO",
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
                    {filtered.map((f) => {
                      const est = ESTADO_STYLE[f.estado]
                      return (
                        <tr
                          key={f.id}
                          onClick={() => setSelectedFactura(f)}
                          className="border-b border-gray-50 cursor-pointer transition-colors hover:bg-green-50/40 group"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-extrabold text-gray-900 leading-none">
                              {f.num.split("-")[0]}-
                            </p>
                            <p className="text-sm font-extrabold text-gray-900">
                              {f.num.split("-")[1]}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-700 leading-snug">
                              {f.proveedor}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-600">{f.fecha}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-extrabold text-gray-900 font-mono">
                              {fmt(f.monto)}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{
                                backgroundColor: est.bg,
                                color: est.color,
                              }}
                            >
                              {f.estado}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 flex-wrap gap-3">
                <p className="text-xs text-gray-500">
                  Mostrando <b className="text-gray-700">{filtered.length}</b>{" "}
                  de <b className="text-gray-700">128</b> facturas
                </p>
                <div className="flex items-center gap-1.5">
                  <button className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                    Anterior
                  </button>
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      className="w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-all"
                      style={
                        p === 1
                          ? { backgroundColor: G, color: "white" }
                          : { color: "#6B7280", border: "1px solid #E5E7EB" }
                      }
                    >
                      {p}
                    </button>
                  ))}
                  <button className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: GL }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke={G}
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Transparencia Municipal
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Toda transacción está sujeta a auditoría de la Contraloría
                    General de Cuentas.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8 text-right">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Última Auditoría
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    22/09/2023
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Estado de Fondo
                  </p>
                  <p
                    className="text-sm font-extrabold mt-0.5"
                    style={{ color: G }}
                  >
                    Saludable
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNuevaOrden && (
        <NuevaOrdenModal
          onClose={() => setShowNuevaOrden(false)}
          onToast={onToast}
        />
      )}
      {selectedFactura && (
        <FacturaDrawer
          factura={selectedFactura}
          onClose={() => setSelectedFactura(null)}
          onToast={onToast}
        />
      )}
    </>
  )
}
