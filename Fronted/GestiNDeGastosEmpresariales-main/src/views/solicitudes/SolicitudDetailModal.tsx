import { useEffect, useRef, useState } from "react"
import { G, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  PRIORIDAD_STYLE,
  ESTADO_SOL_STYLE,
} from "@/models/solicitudes"
import {
  obtenerRequisicion,
  cambiarEstadoRequisicion,
  type Requisicion,
} from "@/api/requisiciones"
import { ApiError } from "@/api/client"

export default function SolicitudDetailModal({
  id,
  onClose,
  onToast,
  onEdit,
  onChanged,
}: {
  id: number
  onClose: () => void
  onToast: (m: string, s: string) => void
  onEdit: (detail: Requisicion) => void
  onChanged: () => void
}) {
  const [detail, setDetail] = useState<Requisicion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [motivo, setMotivo] = useState("")
  const [showRechazo, setShowRechazo] = useState(false)
  const [working, setWorking] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const cargar = async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await obtenerRequisicion(id)
      setDetail(d)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [id])

  const cambiarEstado = async (estado: string, notas?: string) => {
    setWorking(true)
    try {
      await cambiarEstadoRequisicion(id, { estado, notas_aprobacion: notas })
      onToast(
        "Estado actualizado",
        `La solicitud pasó a ${estado}.`,
      )
      setShowRechazo(false)
      setMotivo("")
      await cargar()
      onChanged()
    } catch (e) {
      onToast(
        "Error",
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "No se pudo cambiar el estado",
      )
    } finally {
      setWorking(false)
    }
  }

  const estado = detail?.estado ?? "Pendiente"
  const puedeEditar = estado === "Pendiente"

  const acciones: Array<{ label: string; estado: string; color: string; motivo?: boolean }> = []
  if (estado === "Pendiente") {
    acciones.push({ label: "Enviar a Revisión", estado: "En Revisión", color: "#0EA5E9" })
    acciones.push({ label: "Aprobar", estado: "Aprobada", color: "#16A34A" })
    acciones.push({ label: "Rechazar", estado: "Rechazada", color: "#DC2626", motivo: true })
    acciones.push({ label: "Cancelar", estado: "Cancelada", color: "#6B7280" })
  } else if (estado === "En Revisión") {
    acciones.push({ label: "Aprobar", estado: "Aprobada", color: "#16A34A" })
    acciones.push({ label: "Rechazar", estado: "Rechazada", color: "#DC2626", motivo: true })
  } else if (estado === "Aprobada") {
    acciones.push({ label: "Enviar a Compra", estado: "En Compra", color: "#7C3AED" })
  }

  const bitacora = detail?.bitacora ?? []

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
              <h2 className="text-xl font-bold text-gray-900">
                {detail ? `#${detail.codigo_requisicion}` : `Solicitud #${id}`}
              </h2>
              {detail && (
                <>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${PRIORIDAD_STYLE[detail.prioridad]}`}
                  >
                    {detail.prioridad}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ESTADO_SOL_STYLE[detail.estado]}`}
                  >
                    {detail.estado}
                  </span>
                </>
              )}
            </div>
            {detail && (
              <p className="text-sm text-gray-500 mt-1">
                {detail.nombre_dependencia} ·{" "}
                {new Date(detail.fecha_solicitud).toLocaleDateString("es-GT")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all shrink-0 mt-0.5"
          >
            <Icons.X />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-10">
              Cargando solicitud…
            </p>
          ) : error ? (
            <p className="text-sm text-red-600 text-center py-10">{error}</p>
          ) : detail ? (
            <>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Ítems Solicitados
                </p>
                <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
                  {(detail.items ?? []).map((it) => (
                    <div key={it.id_detalle} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-gray-900 leading-snug">
                          {it.insumo_nombre ?? it.descripcion_libre}
                        </p>
                        <p className="text-sm font-bold font-mono shrink-0" style={{ color: G }}>
                          Q{" "}
                          {(
                            Number(it.cantidad) * Number(it.precio_estimado)
                          ).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Number(it.cantidad).toLocaleString("es-GT")} {it.unidad_nombre} ·{" "}
                        Q {Number(it.precio_estimado).toLocaleString("es-GT", { minimumFractionDigits: 2 })}{" "}
                        c/u
                        {it.observaciones ? ` · ${it.observaciones}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {detail.imagenes && detail.imagenes.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Solicitudes Autorizadas ({detail.imagenes.length})
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {detail.imagenes.map((img) => (
                      <img
                        key={img.id_imagen}
                        src={img.contenido_base64}
                        alt={img.nombre_archivo}
                        className="w-full h-28 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Justificación
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {detail.justificacion}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Solicitante
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {detail.nombre} {detail.apellido}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {detail.nombre_usuario}
                  </p>
                  {detail.tipo_solicitud && (
                    <p className="text-xs text-gray-500 mt-1">{detail.tipo_solicitud}</p>
                  )}
                  {detail.lugar_entrega && (
                    <p className="text-xs text-gray-500 mt-1">
                      Entrega: {detail.lugar_entrega}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Historial de Estado
                </p>
                <div className="space-y-0">
                  {[
                    {
                      detalle: "Solicitud creada",
                      fecha_acceso: detail.fecha_solicitud,
                      nombre_usuario: detail.nombre_usuario,
                    },
                    ...bitacora,
                  ].map((b, i, arr) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: G }}
                        >
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        {i < arr.length - 1 && (
                          <div
                            className="w-px flex-1 my-1"
                            style={{ minHeight: 20, backgroundColor: `${G}60` }}
                          />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-semibold leading-none text-gray-900">
                          {b.detalle}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {new Date(b.fecha_acceso).toLocaleString("es-GT")}
                          {b.nombre_usuario ? ` · ${b.nombre_usuario}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {detail && (
          <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 shrink-0 flex-wrap">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cerrar
            </button>
            {puedeEditar && (
              <button
                onClick={() => onEdit(detail)}
                className="px-5 py-2.5 text-sm font-semibold border rounded-xl transition-all hover:bg-gray-50"
                style={{ color: G, borderColor: GB }}
              >
                <span className="flex items-center gap-2">
                  <Icons.Pencil /> Editar
                </span>
              </button>
            )}
            <div className="flex-1" />
            {acciones.map((a) => (
              <button
                key={a.estado}
                disabled={working}
                onClick={() => (a.motivo ? setShowRechazo(true) : cambiarEstado(a.estado))}
                className="px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
                style={{ backgroundColor: a.color }}
              >
                {a.label}
              </button>
            ))}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: G }}
            >
              <Icons.PDF /> Imprimir
            </button>
          </div>
        )}
      </div>

      {showRechazo && (
        <div
          onClick={(e) => e.target === overlayRef.current && setShowRechazo(false)}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900">Motivo de rechazo</h3>
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
                onClick={() => setShowRechazo(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={!motivo.trim() || working}
                onClick={() => cambiarEstado("Rechazada", motivo.trim())}
                className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#DC2626" }}
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
