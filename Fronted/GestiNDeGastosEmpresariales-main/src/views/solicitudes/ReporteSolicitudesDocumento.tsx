import { G, BRAND_HEX } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import MunicipalSeal from "@/components/common/MunicipalSeal"
import { getStoredUser } from "@/api/auth"
import type { SolicitudRow } from "@/models/solicitudes"
import type { ResumenKpis } from "@/controllers/useDependenciasController"

const KPIS_REPORTE = (k: ResumenKpis): Array<{ label: string; value: string; color: string }> => [
  { label: "Total Solicitudes", value: String(k.total), color: G },
  { label: "Pendientes", value: String(k.pendientes), color: "#D97706" },
  { label: "Rechazadas", value: String(k.rechazadas), color: "#DC2626" },
  { label: "Promedio Pendientes", value: `${k.promedioDias.toFixed(1)} días`, color: "#0EA5E9" },
]

export default function ReporteSolicitudesDocumento({
  rows,
  kpis,
  depFilter,
  onClose,
}: {
  rows: SolicitudRow[]
  kpis: ResumenKpis
  depFilter: string
  onClose: () => void
}) {
  const usuario = getStoredUser()
  const fechaEmision = new Date().toLocaleString("es-GT")

  return (
    <div
      className="print-container fixed inset-0 z-[300] overflow-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
    >
      <div
        className="no-print sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: "rgba(30,94,47,0.95)" }}
      >
        <p className="text-white text-sm font-bold">Vista previa — Reporte de Solicitudes</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: "#FFFFFF", color: G }}
          >
            <Icons.PDF /> Imprimir
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-white/40 text-white transition-all hover:bg-white/10"
          >
            <Icons.X /> Cerrar
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-8 flex justify-center">
        <div
          className="print-area bg-white w-full max-w-4xl rounded-lg shadow-2xl text-gray-900"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <div className="px-10 py-9">
            {/* Encabezado institucional */}
            <div
              className="flex items-start justify-between gap-6 pb-5 border-b-2"
              style={{ borderColor: G }}
            >
              <div className="flex items-center gap-3">
                <MunicipalSeal size={64} />
                <div>
                  <p
                    className="text-xs font-extrabold uppercase tracking-widest"
                    style={{ color: G }}
                  >
                    Municipalidad de Panajachel
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Sistema de Gestión de Gastos Empresariales
                  </p>
                  <p className="text-[11px] text-gray-400">Sololá, Guatemala</p>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: G }}>
                  REPORTE DE SOLICITUDES
                </h1>
                <p className="text-xs text-gray-500 mt-1">Fecha de emisión: {fechaEmision}</p>
                <p className="text-xs text-gray-500">
                  Emitido por: {usuario?.nombre_completo ?? "—"} ({usuario?.nombre_usuario ?? "—"})
                </p>
                {usuario?.rol && <p className="text-[11px] text-gray-400 mt-0.5">Rol: {usuario.rol}</p>}
              </div>
            </div>

            {/* Filtro aplicado */}
            <div className="pt-4 pb-4 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Filtro aplicado:
              </span>
              <span className="text-xs font-bold text-gray-800">{depFilter}</span>
              <span className="text-xs text-gray-300">|</span>
              <span className="text-xs text-gray-500">
                {rows.length} {rows.length === 1 ? "registro" : "registros"} en el reporte
              </span>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-4 gap-3 pb-5">
              {KPIS_REPORTE(kpis).map((k) => (
                <div key={k.label} className="border border-gray-200 rounded-lg px-3 py-2.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-tight">
                    {k.label}
                  </p>
                  <p className="text-xl font-extrabold mt-1 leading-none" style={{ color: k.color }}>
                    {k.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Tabla maestra */}
            <table className="w-full text-sm border border-gray-200">
              <thead>
                <tr
                  className="border-b"
                  style={{ backgroundColor: `${BRAND_HEX}14`, borderColor: `${BRAND_HEX}55` }}
                >
                  {["#", "CÓDIGO", "DEPENDENCIA", "ÍTEM", "CANT.", "PRIORIDAD", "ESTADO", "FECHA", "SOLICITANTE"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-2 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: G }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-xs text-gray-400">
                      Sin solicitudes para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr
                      key={`${r.id}-${i}`}
                      className="border-b border-gray-100 last:border-0"
                      style={i % 2 === 1 ? { backgroundColor: "#F9FAFB" } : undefined}
                    >
                      <td className="px-2 py-2 text-xs font-mono text-gray-400">{i + 1}</td>
                      <td className="px-2 py-2 text-xs font-mono font-bold whitespace-nowrap" style={{ color: G }}>
                        {r.id}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-700 whitespace-nowrap">{r.dep}</td>
                      <td className="px-2 py-2 text-xs text-gray-700">
                        <span className="line-clamp-2">{r.item}</span>
                      </td>
                      <td className="px-2 py-2 text-xs font-mono text-gray-700 whitespace-nowrap">{r.cant}</td>
                      <td className="px-2 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                        {r.prioridad}
                      </td>
                      <td className="px-2 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                        {r.estado}
                      </td>
                      <td className="px-2 py-2 text-xs font-mono text-gray-600 whitespace-nowrap">{r.fecha}</td>
                      <td className="px-2 py-2 text-xs text-gray-600 whitespace-nowrap">{r.solicitante}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Totales */}
            <div className="flex justify-between items-center pt-3">
              <p className="text-[10px] text-gray-400">
                Documento generado automáticamente · No requiere firma electrónica
              </p>
              <p className="text-xs text-gray-700">
                Total de solicitudes en el reporte:{" "}
                <span className="font-extrabold font-mono" style={{ color: G }}>
                  {rows.length}
                </span>
              </p>
            </div>

            {/* Firmas */}
            <div className="grid grid-cols-2 gap-10 pt-16 text-center">
              <div>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs font-bold text-gray-700">Elaborado por</p>
                  <p className="text-[11px] text-gray-400">
                    {usuario?.nombre_completo ?? "—"} · {usuario?.rol ?? "—"}
                  </p>
                </div>
              </div>
              <div>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs font-bold text-gray-700">Vo. Bo. Dirección de Administración y Finanzas</p>
                  <p className="text-[11px] text-gray-400">Municipalidad de Panajachel</p>
                </div>
              </div>
            </div>

            {/* Pie de página */}
            <div className="mt-8 pt-3 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">
                Documento generado por el Sistema de Gestión de Gastos Empresariales ·
                Municipalidad de Panajachel · {fechaEmision}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
