import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { OC_ITEMS, HIST_ENTRIES } from "@/models/bodega"
import NuevaRecepcionModal from "@/views/bodega/NuevaRecepcionModal"
import FinalizarIngresoModal from "@/views/bodega/FinalizarIngresoModal"
import { useBodegaController } from "@/controllers/useBodegaController"

export default function BodegaView({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const {
    verifStates,
    setVerif,
    showNuevaRec,
    setShowNuevaRec,
    showFinalizar,
    setShowFinalizar,
    allVerified,
  } = useBodegaController()

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                Bodega y Recepción
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Control de ingresos de mercancía e inventario de insumos.
              </p>
            </div>
            <button
              onClick={() => setShowNuevaRec(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 shrink-0"
              style={{ backgroundColor: G }}
            >
              <Icons.Plus /> Nueva Recepción
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-extrabold text-gray-900">
                  Alertas de Stock
                </p>
                <svg
                  className="w-5 h-5 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    icon: "📄",
                    name: "Papel Bond A4",
                    sub: "Mín: 50 | Actual: 12",
                    badge: "Crítico",
                    bg: "#FEE2E2",
                    color: "#DC2626",
                  },
                  {
                    icon: "🖨",
                    name: "Tóner HP-415X",
                    sub: "Mín: 5 | Actual: 4",
                    badge: "Bajo",
                    bg: "#DCFCE7",
                    color: "#16A34A",
                  },
                ].map((a) => (
                  <div
                    key={a.name}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50"
                  >
                    <span className="text-lg shrink-0">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-none">
                        {a.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.sub}</p>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: a.bg, color: a.color }}
                    >
                      {a.badge}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  onToast(
                    "Inventario completo",
                    "Cargando vista de inventario detallado...",
                  )
                }
                className="mt-4 w-full py-2.5 text-sm font-bold rounded-xl border-2 transition-all hover:bg-green-50 active:scale-95"
                style={{ color: G, borderColor: G }}
              >
                Ver Inventario Completo
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-extrabold text-gray-900">
                  Resumen Mensual
                </p>
                <p className="text-sm font-semibold text-gray-400">
                  Octubre 2023
                </p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100 mt-2">
                {[
                  { value: "24", label: "Recepciones Exitosas", color: G },
                  { value: "03", label: "Devoluciones", color: "#DC2626" },
                  { value: "12", label: "Órdenes Pendientes", color: G },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-center px-3 py-3 text-center"
                  >
                    <p
                      className="text-4xl font-extrabold font-mono leading-none"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 leading-snug">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-5 items-start flex-wrap xl:flex-nowrap">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-2">
                <div>
                  <p className="text-sm font-extrabold text-gray-900">
                    Recepción de Pedido: OC-2023-045
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Proveedor: Papelería del Lago S.A.
                  </p>
                </div>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}
                >
                  EN PROCESO
                </span>
              </div>

              <div
                className="grid grid-cols-[1fr_auto_1fr] px-5 py-3 border-b border-gray-100"
                style={{ backgroundColor: "#F9FAFB" }}
              >
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  Producto / Insumo
                </p>
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center px-6">
                  Esperado
                </p>
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right">
                  Acciones de Verificación
                </p>
              </div>

              {OC_ITEMS.map((item) => {
                const state = verifStates[item.id] ?? null
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto_1fr] px-5 py-4 border-b border-gray-50 last:border-b-0 items-center transition-colors"
                    style={{
                      backgroundColor:
                        state === "RECIBIDO"
                          ? "#F0FDF4"
                          : state === "RECHAZADO"
                            ? "#FFF5F5"
                            : state === "FALTANTE"
                              ? "#FFFBEB"
                              : undefined,
                    }}
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-snug">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {item.sku}
                      </p>
                    </div>
                    <p
                      className="text-sm font-extrabold px-6 font-mono"
                      style={{ color: G }}
                    >
                      {item.esperado}
                    </p>
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => setVerif(item.id, "RECIBIDO")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95"
                        style={
                          state === "RECIBIDO"
                            ? { backgroundColor: G, color: "white" }
                            : {
                                backgroundColor: "white",
                                color: G,
                                border: `1.5px solid ${G}`,
                              }
                        }
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Recibido
                      </button>
                      <button
                        onClick={() => setVerif(item.id, "RECHAZADO")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95"
                        style={
                          state === "RECHAZADO"
                            ? { backgroundColor: "#DC2626", color: "white" }
                            : {
                                backgroundColor: "white",
                                color: "#DC2626",
                                border: "1.5px solid #DC2626",
                              }
                        }
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Rechazar
                      </button>
                      <button
                        onClick={() => setVerif(item.id, "FALTANTE")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95"
                        style={
                          state === "FALTANTE"
                            ? { backgroundColor: "#D97706", color: "white" }
                            : {
                                backgroundColor: "white",
                                color: "#6B7280",
                                border: "1.5px solid #D1D5DB",
                              }
                        }
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Faltante
                      </button>
                    </div>
                  </div>
                )
              })}

              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
                <button className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                  Cancelar Recepción
                </button>
                <button
                  onClick={() => {
                    if (!allVerified) {
                      onToast(
                        "Verifica todos los ítems",
                        "Marca cada ítem como Recibido, Rechazado o Faltante.",
                      )
                      return
                    }
                    setShowFinalizar(true)
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: G, opacity: allVerified ? 1 : 0.6 }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Finalizar y Cargar a Inventario
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm w-full xl:w-72 shrink-0 overflow-hidden">
              <p className="px-5 pt-5 pb-3 text-base font-extrabold text-gray-900 border-b border-gray-100">
                Historial Reciente
              </p>
              <div className="divide-y divide-gray-50">
                {HIST_ENTRIES.map((h) => {
                  const isRechazo = h.estado === "CON RECHAZO"
                  return (
                    <div
                      key={h.id}
                      className="px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none">
                          {h.fecha}
                        </p>
                        <span
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0"
                          style={
                            isRechazo
                              ? { backgroundColor: "#FEE2E2", color: "#DC2626" }
                              : { backgroundColor: "#DCFCE7", color: "#16A34A" }
                          }
                        >
                          {h.estado}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 leading-snug mt-1">
                        {h.empresa}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {h.oc} | {h.detalle}
                      </p>
                      <button
                        onClick={() =>
                          onToast(h.link, `Cargando detalles de ${h.oc}...`)
                        }
                        className="flex items-center gap-1.5 text-xs font-semibold mt-2 transition-colors hover:opacity-70"
                        style={{ color: G }}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {h.link}
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="px-5 py-4 border-t border-gray-100">
                <button
                  onClick={() =>
                    onToast(
                      "Historial completo",
                      "Cargando historial de todas las recepciones...",
                    )
                  }
                  className="w-full text-xs font-extrabold uppercase tracking-widest transition-colors hover:opacity-70"
                  style={{ color: G }}
                >
                  Ver Historial Completo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNuevaRec && (
        <NuevaRecepcionModal
          onClose={() => setShowNuevaRec(false)}
          onToast={onToast}
        />
      )}
      {showFinalizar && (
        <FinalizarIngresoModal
          states={verifStates}
          onClose={() => setShowFinalizar(false)}
          onToast={onToast}
        />
      )}
    </>
  )
}
