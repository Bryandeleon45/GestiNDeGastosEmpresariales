import { useEffect, useState } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { useProformasController } from "@/controllers/useProformasController"
import { obtenerOrdenCompra, type OrdenCompraLista, type OrdenCompraDetalle } from "@/api/proformas"
import ComparativaProformasView from "@/views/proformas/ComparativaProformasView"
import PublicarProcesoModal from "@/views/proformas/PublicarProcesoModal"
import ProformasRecibidasView from "@/views/proformas/ProformasRecibidasView"
import OrdenCompraDocumento from "@/views/proformas/OrdenCompraDocumento"
import ProcesoAdjudicacionCard from "@/views/proformas/ProcesoAdjudicacionCard"

const OC_STYLE: Record<string, string> = {
  Pendiente: "bg-gray-100 text-gray-600 border border-gray-200",
  Aprobada: "bg-sky-50 text-sky-700 border border-sky-200",
  Enviada: "bg-amber-50 text-amber-700 border border-amber-200",
  Entregada: "bg-green-50 text-green-700 border border-green-200",
  Cancelada: "bg-red-50 text-red-600 border border-red-200",
}

const fmtQ = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

function fmtFecha(iso: string | null) {
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
  const { tab, setTab, ordenes, loadingOrdenes, reload } =
    useProformasController(onToast)

  const [procesoId, setProcesoId] = useState<number | null>(initialProcesoId ?? null)
  const [showPublicar, setShowPublicar] = useState(false)
  const [docOrden, setDocOrden] = useState<OrdenCompraDetalle | null>(null)
  const [cargandoDoc, setCargandoDoc] = useState(false)

  const verDocumentoOrden = async (oc: OrdenCompraLista) => {
    if (oc.id_orden_compra == null) return
    setCargandoDoc(true)
    try {
      const d = await obtenerOrdenCompra(oc.id_orden_compra)
      setDocOrden(d)
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cargar la orden")
    } finally {
      setCargandoDoc(false)
    }
  }

  useEffect(() => {
    if (initialProcesoId != null) setProcesoId(initialProcesoId)
  }, [initialProcesoId])

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

  const procesos = ordenes.filter((o) => o.tipo === "proceso")
  const ordenesList = ordenes.filter((o) => o.tipo === "orden")

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "var(--gray-50)" }}>
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
                Cotizaciones recibidas y órdenes de compra.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
                {(["recibidas", "ordenes"] as const).map((t) => (
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
                    {t === "recibidas" ? "Proformas Recibidas" : "Órdenes"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPublicar(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90"
                style={{ backgroundColor: G }}
              >
                <Icons.Plus /> Publicar Proceso
              </button>
            </div>
          </div>

          {tab === "recibidas" ? (
            <ProformasRecibidasView
              onToast={onToast}
              onVerComparativa={(idProceso) => setProcesoId(idProceso)}
            />
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Procesos por Adjudicar
                </h2>
                {loadingOrdenes ? (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-12 text-center text-sm text-gray-400">
                    Cargando procesos…
                  </div>
                ) : procesos.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-12 text-center text-sm text-gray-400">
                    Sin procesos pendientes de adjudicar.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {procesos.map((p) => (
                      <ProcesoAdjudicacionCard
                        key={`proc-${p.id_proceso}`}
                        proceso={{
                          id_proceso: p.id_proceso!,
                          codigo_requisicion: p.codigo_requisicion,
                          nombre_dependencia: p.nombre_dependencia,
                          tipo_solicitud: p.tipo_solicitud,
                          fase_proceso: p.fase_proceso,
                          fecha_publicacion: p.fecha_publicacion,
                          monto_estimado: p.monto_estimado,
                          invitados: p.invitados,
                        }}
                        onToast={onToast}
                        onAdjudicada={reload}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Órdenes de Compra
                </h2>
                {loadingOrdenes ? (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-12 text-center text-sm text-gray-400">
                    Cargando órdenes…
                  </div>
                ) : ordenesList.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-12 text-center text-sm text-gray-400">
                    Sin órdenes de compra.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ordenesList.map((oc) => (
                      <div
                        key={`oc-${oc.id_orden_compra}`}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                      >
                        <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/60">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-extrabold" style={{ color: G }}>
                                {oc.numero_orden}
                              </span>
                              <span className="text-gray-300">·</span>
                              <span className="font-mono text-xs font-semibold text-gray-500">
                                {oc.codigo_requisicion}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {oc.razon_social} · {oc.nombre_dependencia}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${OC_STYLE[oc.estado ?? ""]}`}
                          >
                            {oc.estado}
                          </span>
                        </div>

                        <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monto</p>
                              <p className="text-sm font-bold font-mono text-gray-800">
                                {fmtQ(oc.monto_total ?? 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha</p>
                              <p className="text-sm font-mono text-gray-600">{fmtFecha(oc.fecha_emision)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              disabled={cargandoDoc}
                              onClick={() => verDocumentoOrden(oc)}
                              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg text-white transition-all hover:opacity-80 disabled:opacity-40"
                              style={{ backgroundColor: G }}
                            >
                              <Icons.PDF /> Imprimir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      {docOrden && (
        <OrdenCompraDocumento orden={docOrden} onClose={() => setDocOrden(null)} />
      )}
    </>
  )
}
