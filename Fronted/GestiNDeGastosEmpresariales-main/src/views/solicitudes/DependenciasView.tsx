import { useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  PRIORIDAD_STYLE,
  ESTADO_SOL_STYLE,
  type SolicitudRow,
} from "@/models/solicitudes"
import RowMenu from "@/views/common/RowMenu"
import SolicitudDetailModal from "@/views/solicitudes/SolicitudDetailModal"
import SolicitudModal from "@/views/solicitudes/SolicitudModal"
import { useDependenciasController } from "@/controllers/useDependenciasController"
import {
  obtenerRequisicion,
  cambiarEstadoRequisicion,
  type Requisicion,
} from "@/api/requisiciones"
import { puedeGestionarSolicitudes } from "@/utils/permisos"

type SolModalState =
  | { mode: "create" }
  | { mode: "edit"; initial: Requisicion }
  | null

export default function DependenciasView({
  onToast,
  onVerProceso,
}: {
  onToast: (m: string, s: string) => void
  onVerProceso?: (idProceso: number) => void
}) {
  const {
    depFilter,
    depFilterId,
    setDepFilterId,
    depOpen,
    setDepOpen,
    page,
    setPage,
    hoveredRow,
    setHoveredRow,
    depRef,
    loading,
    total,
    totalPages,
    pageRows,
    grouped,
    depOptions,
    kpis,
    exportar,
    imprimir,
    reload,
  } = useDependenciasController(onToast)

  const [solModal, setSolModal] = useState<SolModalState>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [rechazoRow, setRechazoRow] = useState<SolicitudRow | null>(null)
  const [motivo, setMotivo] = useState("")
  const [working, setWorking] = useState(false)

  const puedeGestionar = puedeGestionarSolicitudes()

  const abrirEditar = async (row: SolicitudRow) => {
    try {
      const r = await obtenerRequisicion(row.id_requisicion)
      setSolModal({ mode: "edit", initial: r })
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cargar la solicitud")
    }
  }

  const aprobar = async (row: SolicitudRow) => {
    if (!window.confirm(`¿Aprobar la solicitud #${row.id}?`)) return
    setWorking(true)
    try {
      await cambiarEstadoRequisicion(row.id_requisicion, { estado: "Aprobada" })
      onToast("Solicitud aprobada", `#${row.id} fue marcada como Aprobada.`)
      reload()
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo aprobar")
    } finally {
      setWorking(false)
    }
  }

  const cancelar = async (row: SolicitudRow) => {
    if (!window.confirm(`¿Cancelar la solicitud #${row.id}?`)) return
    setWorking(true)
    try {
      await cambiarEstadoRequisicion(row.id_requisicion, { estado: "Cancelada" })
      onToast("Solicitud cancelada", `#${row.id} fue cancelada.`)
      reload()
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cancelar")
    } finally {
      setWorking(false)
    }
  }

  const confirmarRechazo = async () => {
    if (!rechazoRow || !motivo.trim()) return
    setWorking(true)
    try {
      await cambiarEstadoRequisicion(rechazoRow.id_requisicion, {
        estado: "Rechazada",
        notas_aprobacion: motivo.trim(),
      })
      onToast("Solicitud rechazada", `#${rechazoRow.id} fue marcada como Rechazada.`)
      setRechazoRow(null)
      setMotivo("")
      reload()
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo rechazar")
    } finally {
      setWorking(false)
    }
  }

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                Dependencias y Solicitudes
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestione las peticiones de compra de las unidades municipales.
              </p>
            </div>
            <button
              onClick={() => setSolModal({ mode: "create" })}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 shrink-0"
              style={{ backgroundColor: G }}
            >
              <Icons.Plus /> Nueva Solicitud
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                Filtrar por Dependencia
              </p>
              <div ref={depRef} className="relative">
                <button
                  onClick={() => setDepOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm bg-white border rounded-xl transition-all text-left"
                  style={{
                    borderColor: depOpen ? G : "#E5E7EB",
                    boxShadow: depOpen ? `0 0 0 3px ${G}22` : "none",
                  }}
                >
                  <span className="font-semibold text-gray-800">
                    {depFilter}
                  </span>
                  <span className="text-gray-400 ml-2 shrink-0">
                    {depOpen ? <Icons.ChevUp /> : <Icons.ChevDown />}
                  </span>
                </button>
                {depOpen && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[300] overflow-hidden max-h-64 overflow-y-auto"
                    style={{ animation: "dropIn 0.13s ease-out" }}
                  >
                    {depOptions.map((dep) => (
                      <button
                        key={dep.id ?? "todas"}
                        onClick={() => {
                          setDepFilterId(dep.id)
                          setDepOpen(false)
                          setPage(1)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors hover:bg-gray-50"
                        style={{
                          backgroundColor: dep.id === depFilterId ? GL : undefined,
                          color: dep.id === depFilterId ? G : "#374151",
                        }}
                      >
                        <span className="font-medium">{dep.label}</span>
                        {dep.id === depFilterId && (
                          <span style={{ color: G }}>
                            <Icons.CheckMark />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold" style={{ color: G }}>
                Listado Maestro de Solicitudes
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={imprimir}
                  title="Imprimir"
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                  >
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                </button>
                <button
                  onClick={exportar}
                  title="Exportar CSV"
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                >
                  <Icons.Download />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      "DEPENDENCIA / ID",
                      "ÍTEM",
                      "CANT.",
                      "PRIORIDAD",
                      "ESTADO",
                      "FECHA",
                      "PROCESO / OC",
                      "ACCIONES",
                    ].map((h) => (
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
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                        Cargando solicitudes…
                      </td>
                    </tr>
                  ) : grouped.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                        Sin solicitudes para esta dependencia.
                      </td>
                    </tr>
                  ) : (
                    grouped.map((g) => {
                      if (g.type === "header")
                        return (
                          <tr key={`h-${g.dep}-${g.idx}`}>
                            <td
                              colSpan={8}
                              className="px-4 py-2.5 border-t border-b border-gray-100"
                              style={{ backgroundColor: "#F0FAF4" }}
                            >
                              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: G }}>
                                {g.dep}
                              </span>
                            </td>
                          </tr>
                        )
                      const r = g.row
                      return (
                        <tr
                          key={`r-${r.id}-${g.idx}`}
                          onMouseEnter={() => setHoveredRow(r.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          className="border-b border-gray-50 last:border-0 transition-colors"
                          style={{ backgroundColor: hoveredRow === r.id ? "#FAFFFE" : "white" }}
                        >
                          <td className="px-4 py-4">
                            <p className="text-xs font-bold font-mono text-gray-700">#{r.id}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{r.dep}</p>
                          </td>
                          <td className="px-4 py-4 max-w-[200px]">
                            <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
                              {r.item}
                            </p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-gray-700">{r.cant}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${PRIORIDAD_STYLE[r.prioridad]}`}
                            >
                              {r.prioridad}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${ESTADO_SOL_STYLE[r.estado]}`}
                            >
                              {r.estado}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-600 font-mono">{r.fecha}</p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {r.fase_proceso ? (
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                                    r.fase_proceso === "Adjudicada"
                                      ? "bg-green-50 text-green-700 border border-green-200"
                                      : r.fase_proceso === "Desierta"
                                        ? "bg-slate-100 text-slate-500 border border-slate-200"
                                        : r.fase_proceso === "Comparación"
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : "bg-sky-50 text-sky-700 border border-sky-200"
                                  }`}
                                >
                                  {r.fase_proceso}
                                </span>
                                {r.numero_orden && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap bg-purple-50 text-purple-700 border border-purple-200">
                                    {r.numero_orden}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setDetailId(r.id_requisicion)}
                                className="text-sm font-bold transition-colors hover:opacity-70"
                                style={{ color: G }}
                              >
                                Ver
                              </button>
                              {r.id_proceso != null && onVerProceso && (
                                <button
                                  onClick={() => onVerProceso(r.id_proceso!)}
                                  className="text-sm font-semibold transition-colors hover:opacity-70"
                                  style={{ color: "#7C3AED" }}
                                >
                                  Comparativa
                                </button>
                              )}
                              <RowMenu
                                onVer={() => setDetailId(r.id_requisicion)}
                                onEditar={() => abrirEditar(r)}
                                onAprobar={() => aprobar(r)}
                                onRechazar={() => setRechazoRow(r)}
                                puedeGestionar={puedeGestionar}
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 flex-wrap gap-3">
              <p className="text-xs text-gray-500">
                Mostrando <b className="text-gray-700">{pageRows.length}</b> de{" "}
                <b className="text-gray-700">{total}</b> solicitudes
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Icons.ChevLeft />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-all"
                    style={
                      p === page
                        ? { backgroundColor: G, color: "white" }
                        : { border: "1px solid #E5E7EB", color: "#374151" }
                    }
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Icons.ChevRight />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "Total Solicitudes", value: String(kpis.total), sub: "En el período", color: G },
              {
                title: "Pendientes",
                value: String(kpis.pendientes),
                sub: `Promedio ${kpis.promedioDias.toFixed(1)} días`,
                color: "#D97706",
              },
              {
                title: "Rechazadas",
                value: String(kpis.rechazadas),
                sub: "Solicitudes rechazadas",
                color: "#DC2626",
              },
            ].map((m) => (
              <div key={m.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{m.title}</p>
                <p className="text-3xl font-extrabold mt-2 mb-1 leading-none" style={{ color: m.color }}>
                  {m.value}
                </p>
                <p className="text-xs font-medium text-gray-400">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {solModal && (
        <SolicitudModal
          initial={solModal.mode === "edit" ? solModal.initial : null}
          onClose={() => setSolModal(null)}
          onSuccess={() => {
            setSolModal(null)
            reload()
          }}
          onToast={onToast}
        />
      )}

      {detailId != null && (
        <SolicitudDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
          onToast={onToast}
          onChanged={reload}
          onEdit={(detail) => {
            setDetailId(null)
            setSolModal({ mode: "edit", initial: detail })
          }}
        />
      )}

      {rechazoRow && (
        <div
          onClick={(e) => e.target === e.currentTarget && setRechazoRow(null)}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900">
              Motivo de rechazo · #{rechazoRow.id}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              El motivo es obligatorio y quedará registrado en la bitácora.
            </p>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Escriba el motivo del rechazo…"
              className="w-full mt-3 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none focus:border-green-600"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRechazoRow(null)
                  setMotivo("")
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={!motivo.trim() || working}
                onClick={confirmarRechazo}
                className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#DC2626" }}
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
