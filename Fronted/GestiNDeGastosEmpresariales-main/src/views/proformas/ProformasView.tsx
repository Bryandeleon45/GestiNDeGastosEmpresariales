import { useEffect, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { useProformasController } from "@/controllers/useProformasController"
import { cambiarEstadoOrden, type Proceso, type OrdenCompra } from "@/api/proformas"
import ComparativaProformasView from "@/views/proformas/ComparativaProformasView"
import PublicarProcesoModal from "@/views/proformas/PublicarProcesoModal"
import RegistrarCotizacionModal from "@/views/proformas/RegistrarCotizacionModal"

const FASE_STYLE: Record<string, string> = {
  Publicada: "bg-sky-50 text-sky-700 border border-sky-200",
  Comparación: "bg-amber-50 text-amber-700 border border-amber-200",
  Adjudicada: "bg-green-50 text-green-700 border border-green-200",
  Desierta: "bg-slate-100 text-slate-500 border border-slate-200",
}

const OC_STYLE: Record<string, string> = {
  Pendiente: "bg-gray-100 text-gray-600 border border-gray-200",
  Aprobada: "bg-sky-50 text-sky-700 border border-sky-200",
  Enviada: "bg-amber-50 text-amber-700 border border-amber-200",
  Entregada: "bg-green-50 text-green-700 border border-green-200",
  Cancelada: "bg-red-50 text-red-600 border border-red-200",
}

const fmtQ = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

function fmtFecha(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-GT")
}

export default function ProformasView({
  onToast,
  onNav,
  initialProcesoId,
  onClearProcesoId,
}: {
  onToast: (m: string, s: string) => void
  onNav: (key: string) => void
  initialProcesoId?: number | null
  onClearProcesoId?: () => void
}) {
  const { tab, setTab, procesos, loadingProcesos, ordenes, loadingOrdenes, reload, loadOrdenes } =
    useProformasController(onToast)

  const [procesoId, setProcesoId] = useState<number | null>(initialProcesoId ?? null)
  const [showPublicar, setShowPublicar] = useState(false)
  const [regCotizacionProceso, setRegCotizacionProceso] = useState<Proceso | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (initialProcesoId != null) setProcesoId(initialProcesoId)
  }, [initialProcesoId])

  const cambiarEstadoOC = async (oc: OrdenCompra, estado: string) => {
    if (!window.confirm(`¿Cambiar la orden ${oc.numero_orden} a ${estado}?`)) return
    setWorking(true)
    try {
      await cambiarEstadoOrden(oc.id_orden_compra, estado)
      onToast("Orden actualizada", `${oc.numero_orden} pasó a ${estado}.`)
      loadOrdenes()
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo actualizar la orden")
    } finally {
      setWorking(false)
    }
  }

  if (procesoId != null) {
    return (
      <ComparativaProformasView
        idProceso={procesoId}
        onBack={() => {
          setProcesoId(null)
          onClearProcesoId?.()
        }}
        onToast={onToast}
      />
    )
  }

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 flex-wrap">
            <span>Adquisiciones</span>
            <Icons.ChevRight />
            <span style={{ color: G }}>Proformas</span>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                Módulo de Proformas
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Procesos de cotización, comparativa y órdenes de compra.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
                {(["procesos", "ordenes"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="px-4 py-2 text-sm font-bold rounded-lg transition-all"
                    style={
                      tab === t
                        ? { backgroundColor: G, color: "white" }
                        : { color: "#6B7280" }
                    }
                  >
                    {t === "procesos" ? "Procesos de Cotización" : "Órdenes de Compra"}
                  </button>
                ))}
              </div>
              {tab === "procesos" && (
                <button
                  onClick={() => setShowPublicar(true)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90"
                  style={{ backgroundColor: G }}
                >
                  <Icons.Plus /> Publicar Proceso
                </button>
              )}
            </div>
          </div>

          {tab === "procesos" ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold" style={{ color: G }}>
                  Procesos de Cotización
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["CÓDIGO", "DEPENDENCIA", "FASE", "FECHA LÍMITE", "COTIZ.", "ACCIONES"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingProcesos ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                          Cargando procesos…
                        </td>
                      </tr>
                    ) : procesos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                          Sin procesos de cotización. Publique uno desde una solicitud aprobada.
                        </td>
                      </tr>
                    ) : (
                      procesos.map((p) => (
                        <tr key={p.id_proceso} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-4">
                            <p className="text-xs font-bold font-mono text-gray-700">{p.codigo_requisicion}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{p.tipo_solicitud}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-gray-800">{p.nombre_dependencia}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${FASE_STYLE[p.fase]}`}
                            >
                              {p.fase}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-600 font-mono">{fmtFecha(p.fecha_limite)}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-gray-700">{p.total_cotizaciones} / {p.total_invitados}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setProcesoId(p.id_proceso)}
                                className="text-sm font-bold transition-colors hover:opacity-70"
                                style={{ color: G }}
                              >
                                {p.fase === "Publicada" ? "Gestionar" : "Ver Comparativa"}
                              </button>
                              {p.fase === "Publicada" && (
                                <button
                                  onClick={() => setRegCotizacionProceso(p)}
                                  className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                                >
                                  Registrar Cotización
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold" style={{ color: G }}>
                  Órdenes de Compra
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["N. ORDEN", "SOLICITUD", "PROVEEDOR", "MONTO", "ESTADO", "FECHA", "ACCIONES"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrdenes ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                          Cargando órdenes…
                        </td>
                      </tr>
                    ) : ordenes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                          Sin órdenes de compra.
                        </td>
                      </tr>
                    ) : (
                      ordenes.map((oc) => (
                        <tr key={oc.id_orden_compra} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-4">
                            <p className="text-xs font-bold font-mono text-gray-700">{oc.numero_orden}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-xs font-mono text-gray-600">{oc.codigo_requisicion}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-gray-800">{oc.razon_social}</p>
                            <p className="text-[11px] text-gray-400">{oc.nit}</p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm font-bold font-mono text-gray-800">{fmtQ(oc.monto_total)}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${OC_STYLE[oc.estado]}`}
                            >
                              {oc.estado}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-600 font-mono">{fmtFecha(oc.fecha_emision)}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {oc.estado === "Pendiente" && (
                                <button
                                  disabled={working}
                                  onClick={() => cambiarEstadoOC(oc, "Aprobada")}
                                  className="text-sm font-bold transition-colors hover:opacity-70 disabled:opacity-40"
                                  style={{ color: "#16A34A" }}
                                >
                                  Aprobar
                                </button>
                              )}
                              {oc.estado === "Aprobada" && (
                                <button
                                  disabled={working}
                                  onClick={() => cambiarEstadoOC(oc, "Enviada")}
                                  className="text-sm font-bold transition-colors hover:opacity-70 disabled:opacity-40"
                                  style={{ color: G }}
                                >
                                  Enviar
                                </button>
                              )}
                              {["Pendiente", "Aprobada"].includes(oc.estado) && (
                                <button
                                  disabled={working}
                                  onClick={() => cambiarEstadoOC(oc, "Cancelada")}
                                  className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </td>
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

      {showPublicar && (
        <PublicarProcesoModal
          onClose={() => setShowPublicar(false)}
          onSuccess={() => {
            setShowPublicar(false)
            reload()
          }}
          onToast={onToast}
        />
      )}

      {regCotizacionProceso && (
        <RegistrarCotizacionModal
          proceso={regCotizacionProceso}
          onClose={() => setRegCotizacionProceso(null)}
          onSuccess={() => {
            setRegCotizacionProceso(null)
            reload()
          }}
          onToast={onToast}
        />
      )}
    </>
  )
}
