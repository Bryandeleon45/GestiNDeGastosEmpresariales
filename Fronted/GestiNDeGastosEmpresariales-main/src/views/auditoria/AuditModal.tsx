import { useState, useRef } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { ALL_AUDIT, PAGE_SIZE, TIPO_OPTIONS } from "@/models/auditoria"
import Dropdown from "@/views/common/Dropdown"

export default function AuditModal({
  onClose,
  onExport,
}: {
  onClose: () => void
  onExport: () => void
}) {
  const [usuario, setUsuario] = useState("A. Reyes")
  const [tipoAct, setTipoAct] = useState("Todas las actividades")
  const [fecha, setFecha] = useState("11/06/2026")
  const [page, setPage] = useState(1)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [focusUser, setFocusUser] = useState(false)
  const [focusFecha, setFocusFecha] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const totalPages = Math.ceil(ALL_AUDIT.length / PAGE_SIZE)

  const filtered = ALL_AUDIT.filter((e) => {
    if (
      usuario.trim() &&
      !e.usuario.toLowerCase().includes(usuario.toLowerCase())
    )
      return false
    if (tipoAct !== "Todas las actividades") {
      const map: Record<string, string[]> = {
        "Orden de Compra": ["Procesado"],
        Aprobación: ["Auto-Aprobado"],
        Actualización: ["Actualizado"],
        Creación: ["Creado"],
        Borrador: ["Guardado"],
      }
      if (!map[tipoAct]?.includes(e.estado)) return false
    }
    return true
  })
  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageEntries = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.52)",
        backdropFilter: "blur(1.5px)",
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full flex flex-col"
        style={{
          maxWidth: 900,
          animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-none">
              Registro de Actividades Recientes
            </h2>
            <p
              className="text-xs font-bold uppercase tracking-widest mt-1.5"
              style={{ color: G }}
            >
              Institutional Audit Log
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500 hidden sm:block">
              Thursday, June 11, 2026
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Icons.X />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: G }}
              >
                Usuario:
              </label>
              <input
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                onFocus={() => setFocusUser(true)}
                onBlur={() => setFocusUser(false)}
                className="w-full px-3 py-2.5 text-sm bg-white border rounded-lg outline-none transition-all"
                style={{
                  borderColor: focusUser ? G : "#D1D5DB",
                  boxShadow: focusUser ? `0 0 0 3px ${G}22` : "none",
                }}
                placeholder="Filtrar usuario..."
              />
            </div>
            <Dropdown
              label="Tipo de Actividad:"
              value={tipoAct}
              options={TIPO_OPTIONS}
              onChange={(v) => {
                setTipoAct(v)
                setPage(1)
              }}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Filtrar por Fecha:
              </label>
              <div className="flex">
                <input
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  onFocus={() => setFocusFecha(true)}
                  onBlur={() => setFocusFecha(false)}
                  placeholder="DD/MM/YYYY"
                  className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-white border border-r-0 rounded-l-lg outline-none transition-all"
                  style={{
                    borderColor: focusFecha ? G : "#D1D5DB",
                    boxShadow: focusFecha ? `0 0 0 3px ${G}22` : "none",
                  }}
                />
                <button
                  onClick={() => setPage(1)}
                  className="px-3 py-2.5 text-white rounded-r-lg transition-all hover:opacity-90 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: G }}
                >
                  <Icons.Search />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  "FECHA Y HORA",
                  "USUARIO",
                  "ACTIVIDAD/SOLICITUD",
                  "DESCRIPCIÓN DETALLADA",
                  "ESTADO",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-gray-400"
                  >
                    Sin resultados.
                  </td>
                </tr>
              ) : (
                pageEntries.map((e, i) => (
                  <tr
                    key={i}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className="border-b border-gray-100 last:border-0 transition-colors"
                    style={{
                      backgroundColor: hoveredRow === i ? "#F0FAF4" : undefined,
                    }}
                  >
                    <td className="px-4 py-3.5 text-xs font-mono text-gray-600 whitespace-nowrap">
                      {e.fecha}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-sm font-semibold ${
                          e.usuario === "(System)"
                            ? "text-gray-400 italic"
                            : "text-gray-900"
                        }`}
                      >
                        {e.usuario}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${
                          e.actividadColor === "green"
                            ? "text-white"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                        style={
                          e.actividadColor === "green"
                            ? { backgroundColor: G }
                            : {}
                        }
                      >
                        {e.actividad}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700 max-w-xs">
                      {e.descripcion}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${e.estadoStyle}`}
                      >
                        <e.EstadoIcon />
                        {e.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cerrar
            </button>
            <span className="text-xs text-gray-500">
              Mostrando <b className="text-gray-700">{pageEntries.length}</b> de{" "}
              <b className="text-gray-700">{ALL_AUDIT.length}</b> entradas
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Icons.ChevLeft />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-all"
                style={
                  p === page
                    ? { backgroundColor: G, color: "white" }
                    : {
                        border: "1px solid #E5E7EB",
                        color: "#374151",
                        backgroundColor: "white",
                      }
                }
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Icons.ChevRight />
            </button>
          </div>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all shadow-sm active:scale-95 uppercase tracking-wide"
            style={{ backgroundColor: G }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#175228")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = G)}
          >
            <Icons.Download />
            Exportar Log
          </button>
        </div>
      </div>
    </div>
  )
}
