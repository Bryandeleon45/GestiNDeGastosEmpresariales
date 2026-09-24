import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  ALL_DEPS_NAMES,
  PRIORIDAD_STYLE,
  ESTADO_SOL_STYLE,
} from "@/models/solicitudes"
import RowMenu from "@/views/common/RowMenu"
import SolicitudDetailModal from "@/views/solicitudes/SolicitudDetailModal"
import { useDependenciasController } from "@/controllers/useDependenciasController"

export default function DependenciasView({
  onNewSolicitud,
  onToast,
}: {
  onNewSolicitud: () => void
  onToast: (m: string, s: string) => void
}) {
  const {
    depFilter,
    setDepFilter,
    depOpen,
    setDepOpen,
    page,
    setPage,
    detailRow,
    setDetailRow,
    hoveredRow,
    setHoveredRow,
    depRef,
    filtered,
    totalPages,
    pageRows,
    grouped,
  } = useDependenciasController()

  const summaryMetrics = [
    {
      title: "Total Solicitudes",
      value: "124",
      sub: "↑ 12% vs mes anterior",
      subColor: "#16A34A",
    },
    {
      title: "Pendientes",
      value: "18",
      sub: "Promedio 4.2 días",
      subColor: "#D97706",
    },
    {
      title: "Monto Solicitado",
      value: "Q 45,280",
      sub: "Mes de Mayo 2024",
      subColor: "#6B7280",
    },
    {
      title: "Ejecución",
      value: "88%",
      sub: "Meta Institucional",
      subColor: "#16A34A",
    },
  ]

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
              onClick={onNewSolicitud}
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
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[300] overflow-hidden"
                    style={{ animation: "dropIn 0.13s ease-out" }}
                  >
                    {ALL_DEPS_NAMES.map((dep) => (
                      <button
                        key={dep}
                        onClick={() => {
                          setDepFilter(dep)
                          setDepOpen(false)
                          setPage(1)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors hover:bg-gray-50"
                        style={{
                          backgroundColor: dep === depFilter ? GL : undefined,
                          color: dep === depFilter ? G : "#374151",
                        }}
                      >
                        <span className="font-medium">{dep}</span>
                        {dep === depFilter && (
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

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: G }}>
                  <Icons.Info />
                </span>
                <p className="text-sm font-bold" style={{ color: G }}>
                  Estado de Presupuesto
                </p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                El presupuesto anual disponible para compras operativas presenta
                un avance del 64%.
              </p>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: "64%", backgroundColor: G }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: G }}
                >
                  64% ejecutado
                </span>
                <span className="text-[11px] text-gray-400">
                  Q 4.5M presupuesto
                </span>
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
                  onClick={() =>
                    onToast(
                      "Imprimiendo listado...",
                      "El documento se enviará a la impresora.",
                    )
                  }
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
                  onClick={() =>
                    onToast(
                      "Exportando CSV...",
                      "El archivo se descargará en un momento.",
                    )
                  }
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
                  {grouped.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-gray-400"
                      >
                        Sin solicitudes para esta dependencia.
                      </td>
                    </tr>
                  ) : (
                    grouped.map((g) => {
                      if (g.type === "header")
                        return (
                          <tr key={`h-${g.dep}-${g.idx}`}>
                            <td
                              colSpan={7}
                              className="px-4 py-2.5 border-t border-b border-gray-100"
                              style={{ backgroundColor: "#F0FAF4" }}
                            >
                              <span
                                className="text-xs font-bold uppercase tracking-wide"
                                style={{ color: G }}
                              >
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
                          style={{
                            backgroundColor:
                              hoveredRow === r.id ? "#FAFFFE" : "white",
                          }}
                        >
                          <td className="px-4 py-4">
                            <p className="text-xs font-bold font-mono text-gray-700">
                              #{r.id}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {r.dep}
                            </p>
                          </td>
                          <td className="px-4 py-4 max-w-[200px]">
                            <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
                              {r.item}
                            </p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-gray-700">
                              {r.cant}
                            </p>
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
                            <p className="text-sm text-gray-600 font-mono">
                              {r.fecha}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setDetailRow(r)}
                                className="text-sm font-bold transition-colors hover:opacity-70"
                                style={{ color: G }}
                              >
                                Ver
                              </button>
                              <RowMenu
                                onVer={() => setDetailRow(r)}
                                onEditar={() =>
                                  onToast(
                                    "Editando solicitud",
                                    `#${r.id} abierta para edición.`,
                                  )
                                }
                                onAprobar={() =>
                                  onToast(
                                    "Solicitud aprobada",
                                    `#${r.id} fue marcada como Aprobada.`,
                                  )
                                }
                                onRechazar={() =>
                                  onToast(
                                    "Solicitud rechazada",
                                    `#${r.id} fue marcada como Rechazada.`,
                                  )
                                }
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
                Mostrando{" "}
                <b className="text-gray-700">
                  {Math.min((page - 1) * 5 + 1, filtered.length)}–
                  {Math.min(page * 5, filtered.length)}
                </b>{" "}
                de <b className="text-gray-700">{filtered.length}</b>{" "}
                solicitudes
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Icons.ChevLeft />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
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
                  ),
                )}
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryMetrics.map((m) => (
              <div
                key={m.title}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
              >
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {m.title}
                </p>
                <p
                  className="text-3xl font-extrabold mt-2 mb-1 leading-none"
                  style={{ color: m.subColor }}
                >
                  {m.value}
                </p>
                <p className="text-xs font-medium text-gray-400">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {detailRow && (
        <SolicitudDetailModal
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onEdit={() => {
            setDetailRow(null)
            onNewSolicitud()
          }}
        />
      )}
    </>
  )
}
