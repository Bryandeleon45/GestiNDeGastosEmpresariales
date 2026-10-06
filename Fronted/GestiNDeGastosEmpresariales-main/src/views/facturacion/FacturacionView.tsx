import { useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { useFacturacionController } from "@/controllers/useFacturacionController"
import { type Factura } from "@/api/facturacion"
import NuevaOrdenModal from "@/views/facturacion/NuevaOrdenModal"
import FacturaDrawer from "@/views/facturacion/FacturaDrawer"
import RegistrarFacturaModal from "@/views/facturacion/RegistrarFacturaModal"

const ESTADO_STYLE: Record<string, { bg: string; color: string }> = {
  Pagado: { bg: "#DCFCE7", color: "#16A34A" },
  Pendiente: { bg: "#FEF9C3", color: "#854D0E" },
  Vencido: { bg: "#FEE2E2", color: "#DC2626" },
  Rechazada: { bg: "#F1F5F9", color: "#64748B" },
}

const fmt = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

export default function FacturacionView({
  onToast,
  onNav,
}: {
  onToast: (m: string, s: string) => void
  onNav: (k: string) => void
}) {
  const {
    facturas,
    loading,
    resumen,
    cronograma,
    estadoFilter,
    setEstadoFilter,
    showEstadoDD,
    setShowEstadoDD,
    showNuevaOrden,
    setShowNuevaOrden,
    selectedFactura,
    setSelectedFactura,
    estadoDDRef,
    reload,
  } = useFacturacionController(onToast)

  const [showRegistrar, setShowRegistrar] = useState(false)

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
                {fmt(resumen?.total_por_pagar ?? 0)}
              </p>
              <p className="text-xs font-bold mt-1.5" style={{ color: G }}>
                Órdenes pendientes del mes
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
                  <Icons.FileText />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-gray-900 mt-3 font-mono">
                {resumen?.facturas_pendientes ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1.5">
                {resumen?.en_revision ?? 0} en revisión técnica
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
                  <Icons.HistoryClock />
                </div>
              </div>
              <p className="text-4xl font-extrabold font-mono mt-3 text-red-600">
                {String(resumen?.vencimientos_proximos ?? 0).padStart(2, "0")}
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
                Portal de Facturación
              </p>
              <p className="text-xs opacity-80 leading-relaxed">
                Carga digital de facturas y documentos de soporte para agilizar
                procesos.
              </p>
              <div
                onClick={() => onToast("Información", "El proveedor carga facturas desde su portal.")}
                className="flex-1 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-3 cursor-pointer transition-all"
                style={{
                  borderColor: "rgba(255,255,255,0.45)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              >
                <Icons.Download />
                <p className="text-[10px] font-semibold text-center opacity-80 leading-tight">
                  Los proveedores cargan
                  <br />
                  sus facturas PDF/XML
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-5 items-start flex-wrap xl:flex-nowrap">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 w-full xl:w-64 shrink-0">
              <p className="text-base font-extrabold text-gray-900 mb-3">
                Cronograma de Pagos
              </p>
              <div className="space-y-2.5">
                {cronograma.length === 0 && (
                  <p className="text-xs text-gray-400 py-6 text-center">
                    Sin pagos programados o vencimientos.
                  </p>
                )}
                {cronograma.slice(0, 8).map((c) => {
                  const vencida =
                    c.fecha_vencimiento &&
                    new Date(c.fecha_vencimiento) < new Date()
                  const danger = vencida
                  return (
                    <div
                      key={c.numero_orden_pago}
                      className="rounded-lg px-3 py-2.5 border-l-4"
                      style={
                        danger
                          ? { backgroundColor: "#FEF2E2", borderColor: "#F87171" }
                          : { backgroundColor: "#ECFDF5", borderColor: G }
                      }
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <svg
                          className="w-3.5 h-3.5 shrink-0"
                          fill="none"
                          stroke={danger ? "#EF4444" : G}
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          {danger ? (
                            <>
                              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </>
                          ) : (
                            <>
                              <rect x="3" y="4" width="18" height="18" rx="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </>
                          )}
                        </svg>
                        <p
                          className="text-[11px] font-extrabold"
                          style={{ color: danger ? "#DC2626" : G }}
                        >
                          {danger ? "Vencido" : c.estado === "Programada" ? "Pago Programado" : "Pendiente"}
                        </p>
                      </div>
                      <p className="text-[11px] leading-snug" style={{ color: danger ? "#B91C1C" : "#166534" }}>
                        {c.razon_social} · {c.numero_factura}
                      </p>
                      <p className="text-[11px] font-bold" style={{ color: danger ? "#DC2626" : G }}>
                        {fmt(c.monto)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 flex-wrap">
                <p className="text-base font-extrabold text-gray-900">
                  Historial de Facturas y Pagos
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRegistrar(true)}
                    className="text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all hover:bg-gray-50"
                    style={{ color: G, borderColor: "#D1D5DB" }}
                  >
                    <Icons.PlusSmall /> Registrar Factura
                  </button>
                  <div className="relative" ref={estadoDDRef}>
                    <button
                      onClick={() => setShowEstadoDD((v) => !v)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      {estadoFilter === "Todos" ? "Todos los estados" : estadoFilter}
                      <Icons.ChevDown />
                    </button>
                    {showEstadoDD && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden min-w-[160px]">
                        {(["Todos", "Pagado", "Pendiente", "Vencido", "Rechazada"] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setEstadoFilter(opt)
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
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px]">
                  <thead>
                    <tr className="border-b border-gray-100" style={{ backgroundColor: "#F9FAFB" }}>
                      {["NO. FACTURA", "PROVEEDOR", "FECHA EMISIÓN", "MONTO", "ESTADO"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                          Cargando facturas…
                        </td>
                      </tr>
                    ) : facturas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                          Sin facturas registradas.
                        </td>
                      </tr>
                    ) : (
                      facturas.map((f) => {
                        const est = ESTADO_STYLE[f.estado_visible] ?? ESTADO_STYLE.Pendiente
                        return (
                          <tr
                            key={f.id_factura}
                            onClick={() => setSelectedFactura(f)}
                            className="border-b border-gray-50 cursor-pointer transition-colors hover:bg-green-50/40 group"
                          >
                            <td className="px-5 py-4">
                              <p className="text-sm font-extrabold text-gray-900">
                                {f.serie ? `${f.serie}-` : ""}{f.numero_factura}
                              </p>
                              <p className="text-[11px] text-gray-400">{f.numero_orden}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm text-gray-700 leading-snug">{f.razon_social}</p>
                              <p className="text-[11px] text-gray-400">{f.nit}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm text-gray-600">{f.fecha_emision}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-extrabold text-gray-900 font-mono">{fmt(f.monto_total)}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className="text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: est.bg, color: est.color }}
                              >
                                {f.estado_visible}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNuevaOrden && (
        <NuevaOrdenModal
          onClose={() => setShowNuevaOrden(false)}
          onSuccess={() => {
            setShowNuevaOrden(false)
            reload()
          }}
          onToast={onToast}
        />
      )}
      {showRegistrar && (
        <RegistrarFacturaModal
          onClose={() => setShowRegistrar(false)}
          onSuccess={() => {
            setShowRegistrar(false)
            reload()
          }}
          onToast={onToast}
        />
      )}
      {selectedFactura && (
        <FacturaDrawer
          facturaId={selectedFactura.id_factura}
          onClose={() => setSelectedFactura(null)}
          onToast={onToast}
          onChanged={reload}
        />
      )}
    </>
  )
}
