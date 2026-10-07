import { useState } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { useBodegaController } from "@/controllers/useBodegaController"
import { type Recepcion } from "@/api/bodega"
import NuevaRecepcionModal from "@/views/bodega/NuevaRecepcionModal"
import VerificarRecepcionModal from "@/views/bodega/VerificarRecepcionModal"

const ESTADO_REC_STYLE: Record<string, { bg: string; color: string }> = {
  "En Proceso": { bg: "#DCFCE7", color: "#16A34A" },
  Completa: { bg: "#DCFCE7", color: "#16A34A" },
  Parcial: { bg: "#FEF9C3", color: "#854D0E" },
  "Con Novedades": { bg: "#FEE2E2", color: "#DC2626" },
  Cancelada: { bg: "#F1F5F9", color: "#64748B" },
}

const ALERTA_STYLE: Record<string, { bg: string; color: string }> = {
  Crítico: { bg: "#FEE2E2", color: "#DC2626" },
  Bajo: { bg: "#FEF9C3", color: "#854D0E" },
  OK: { bg: "#DCFCE7", color: "#16A34A" },
}

const TIPO_KARDEX_STYLE: Record<string, string> = {
  Entrada: "bg-green-50 text-green-700 border border-green-200",
  Salida: "bg-red-50 text-red-600 border border-red-200",
  Ajuste: "bg-amber-50 text-amber-700 border border-amber-200",
}

function fmtFecha(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function BodegaView({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const {
    tab,
    setTab,
    inventario,
    alertas,
    recepciones,
    kardex,
    resumen,
    loadingInventario,
    loadingRecepciones,
    reload,
  } = useBodegaController(onToast)

  const [showNuevaRec, setShowNuevaRec] = useState(false)
  const [verifRecepcion, setVerifRecepcion] = useState<Recepcion | null>(null)

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
                <p className="text-base font-extrabold text-gray-900">Alertas de Stock</p>
                <Icons.Warning />
              </div>
              <div className="space-y-2.5">
                {alertas.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">Sin alertas de stock.</p>
                )}
                {alertas.slice(0, 5).map((a) => (
                  <div key={a.id_insumo} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-none">{a.nombre}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.codigo_insumo} · Stock {a.stock_actual} / Mín {a.stock_minimo}
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: ALERTA_STYLE[a.alerta].bg, color: ALERTA_STYLE[a.alerta].color }}
                    >
                      {a.alerta}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setTab("inventario")}
                className="mt-4 w-full py-2.5 text-sm font-bold rounded-xl border-2 transition-all hover:bg-green-50 active:scale-95"
                style={{ color: G, borderColor: G }}
              >
                Ver Inventario Completo
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-base font-extrabold text-gray-900 mb-4">Resumen</p>
              <div className="grid grid-cols-3 divide-x divide-gray-100 mt-2">
                {[
                  { label: "Recepciones", value: resumen?.recepciones ?? 0, color: G },
                  { label: "En Proceso", value: resumen?.en_proceso ?? 0, color: "#D97706" },
                  { label: "Alertas Stock", value: resumen?.alertas_stock ?? 0, color: "#DC2626" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center px-3 py-3 text-center">
                    <p className="text-4xl font-extrabold font-mono leading-none" style={{ color: s.color }}>
                      {s.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 leading-snug">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(["recepciones", "inventario", "kardex"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-2 text-sm font-bold rounded-xl transition-all"
                style={tab === t ? { backgroundColor: G, color: "white" } : { color: "#6B7280", border: "1px solid #E5E7EB", backgroundColor: "white" }}
              >
                {t === "recepciones" ? "Recepciones" : t === "inventario" ? "Inventario" : "Kardex"}
              </button>
            ))}
          </div>

          {tab === "recepciones" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold" style={{ color: G }}>Historial de Recepciones</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["COMPROBANTE", "ORDEN", "PROVEEDOR", "FECHA", "ESTADO", "ACCIONES"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRecepciones ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">Cargando recepciones…</td></tr>
                    ) : recepciones.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">Sin recepciones registradas.</td></tr>
                    ) : (
                      recepciones.map((r) => {
                        const est = ESTADO_REC_STYLE[r.estado] ?? { bg: "#F1F5F9", color: "#64748B" }
                        return (
                          <tr key={r.id_recepcion} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-4"><p className="text-xs font-bold font-mono text-gray-700">{r.numero_comprobante}</p></td>
                            <td className="px-4 py-4"><p className="text-xs font-mono text-gray-600">{r.numero_orden}</p></td>
                            <td className="px-4 py-4"><p className="text-sm font-medium text-gray-800">{r.razon_social}</p></td>
                            <td className="px-4 py-4 whitespace-nowrap"><p className="text-sm text-gray-600 font-mono">{fmtFecha(r.fecha_recepcion)}</p></td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap" style={{ backgroundColor: est.bg, color: est.color }}>
                                {r.estado}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {r.estado === "En Proceso" ? (
                                <button onClick={() => setVerifRecepcion(r)} className="text-sm font-bold transition-colors hover:opacity-70" style={{ color: G }}>
                                  Verificar
                                </button>
                              ) : (
                                <button onClick={() => onToast("Recepción", `Comprobante ${r.numero_comprobante} (${r.estado}).`)} className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                                  Ver
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "inventario" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold" style={{ color: G }}>Inventario de Insumos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["CÓDIGO", "INSUMO", "CATEGORÍA", "STOCK", "MÍNIMO", "ESTADO"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingInventario ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">Cargando inventario…</td></tr>
                    ) : inventario.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">Sin insumos en inventario.</td></tr>
                    ) : (
                      inventario.map((inv) => {
                        const al = ALERTA_STYLE[inv.alerta] ?? ALERTA_STYLE.OK
                        return (
                          <tr key={inv.id_insumo} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-4"><p className="text-xs font-mono font-bold text-gray-700">{inv.codigo_insumo}</p></td>
                            <td className="px-4 py-4"><p className="text-sm font-medium text-gray-800">{inv.nombre}</p></td>
                            <td className="px-4 py-4"><p className="text-sm text-gray-600">{inv.categoria}</p></td>
                            <td className="px-4 py-4"><p className="text-sm font-bold font-mono text-gray-900">{inv.stock_actual} {inv.unidad_simbolo}</p></td>
                            <td className="px-4 py-4"><p className="text-sm text-gray-600">{inv.stock_minimo}</p></td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap" style={{ backgroundColor: al.bg, color: al.color }}>
                                {inv.alerta}
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
          )}

          {tab === "kardex" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold" style={{ color: G }}>Kardex de Movimientos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["FECHA", "INSUMO", "TIPO", "CANT.", "ANTERIOR", "ACTUAL", "USUARIO"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kardex.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Sin movimientos de kardex.</td></tr>
                    ) : (
                      kardex.map((k) => (
                        <tr key={k.id_kardex} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap"><p className="text-sm text-gray-600 font-mono">{fmtFecha(k.fecha_movimiento)}</p></td>
                          <td className="px-4 py-4"><p className="text-sm font-medium text-gray-800">{k.insumo_nombre}</p></td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${TIPO_KARDEX_STYLE[k.tipo_movimiento]}`}>
                              {k.tipo_movimiento}
                            </span>
                          </td>
                          <td className="px-4 py-4"><p className="text-sm font-bold font-mono text-gray-900">{k.cantidad}</p></td>
                          <td className="px-4 py-4"><p className="text-sm text-gray-600">{k.stock_anterior}</p></td>
                          <td className="px-4 py-4"><p className="text-sm font-bold text-gray-900">{k.stock_actual}</p></td>
                          <td className="px-4 py-4"><p className="text-sm text-gray-600">{k.nombre_usuario}</p></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNuevaRec && (
        <NuevaRecepcionModal
          onClose={() => setShowNuevaRec(false)}
          onSuccess={(recepcion) => {
            setShowNuevaRec(false)
            reload()
            setVerifRecepcion(recepcion)
          }}
          onToast={onToast}
        />
      )}
      {verifRecepcion && (
        <VerificarRecepcionModal
          recepcion={verifRecepcion}
          onClose={() => setVerifRecepcion(null)}
          onChanged={() => {
            setVerifRecepcion(null)
            reload()
          }}
          onToast={onToast}
        />
      )}
    </>
  )
}
