import { useRef } from "react"
import { G, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  PRIORIDAD_STYLE,
  ESTADO_SOL_STYLE,
  type SolicitudRow,
} from "@/models/solicitudes"

export default function SolicitudDetailModal({
  row,
  onClose,
  onEdit,
}: {
  row: SolicitudRow
  onClose: () => void
  onEdit: () => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const timeline = [
    { label: "Solicitud creada", date: row.fecha, done: true },
    {
      label: "En revisión DAFIM",
      date: row.fecha,
      done: row.estado !== "Pendiente",
    },
    {
      label: "Aprobación alcalde",
      date:
        row.estado === "Aprobado" || row.estado === "Pagado" ? row.fecha : "—",
      done: row.estado === "Aprobado" || row.estado === "Pagado",
    },
    {
      label: "Pago procesado",
      date: row.estado === "Pagado" ? row.fecha : "—",
      done: row.estado === "Pagado",
    },
  ]
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">#{row.id}</h2>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${PRIORIDAD_STYLE[row.prioridad]}`}
              >
                {row.prioridad}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ESTADO_SOL_STYLE[row.estado]}`}
              >
                {row.estado}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {row.dep} · {row.fecha}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all shrink-0 mt-0.5"
          >
            <Icons.X />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Ítem Solicitado
              </p>
              <p className="text-sm font-bold text-gray-900 leading-snug">
                {row.item}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Cantidad
                  </p>
                  <p className="text-sm font-bold text-gray-800">{row.cant}</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Monto
                  </p>
                  <p
                    className="text-sm font-bold font-mono"
                    style={{ color: G }}
                  >
                    {row.monto}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Solicitante
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {row.solicitante}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Dependencia
              </p>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-2"
                style={{ backgroundColor: G }}
              >
                <Icons.Dependencias />
              </div>
              <p className="text-sm font-bold text-gray-900 leading-snug">
                {row.dep}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Justificación
            </p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                {row.justificacion}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Historial de Estado
            </p>
            <div className="space-y-0">
              {timeline.map((t, i) => (
                <div key={t.label} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                      style={{
                        backgroundColor: t.done ? G : "#F3F4F6",
                        border: t.done ? "none" : "2px solid #E5E7EB",
                      }}
                    >
                      {t.done && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    {i < timeline.length - 1 && (
                      <div
                        className="w-px flex-1 my-1"
                        style={{
                          minHeight: 20,
                          backgroundColor: t.done ? `${G}60` : "#E5E7EB",
                        }}
                      />
                    )}
                  </div>
                  <div className="pb-4">
                    <p
                      className={`text-sm font-semibold leading-none ${
                        t.done ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {t.label}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">{t.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            Cerrar
          </button>
          <button
            onClick={onEdit}
            className="px-5 py-2.5 text-sm font-semibold border rounded-xl transition-all hover:bg-gray-50"
            style={{ color: G, borderColor: GB }}
          >
            <span className="flex items-center gap-2">
              <Icons.Pencil /> Editar
            </span>
          </button>
          <div className="flex-1" />
          <button
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: G }}
          >
            <Icons.PDF /> Imprimir Solicitud
          </button>
        </div>
      </div>
    </div>
  )
}
