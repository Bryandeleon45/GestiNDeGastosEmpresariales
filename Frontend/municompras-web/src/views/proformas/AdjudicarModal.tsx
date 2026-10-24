import { useState } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  adjudicarProceso,
  type ComparativaProveedor,
  type ComparativaItem,
} from "@/api/proformas"
import { ApiError } from "@/api/client"

const fmt = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

export default function AdjudicarModal({
  idProceso,
  cotizacion,
  items,
  onClose,
  onSuccess,
  onToast,
}: {
  idProceso: number
  cotizacion: ComparativaProveedor
  items: ComparativaItem[]
  onClose: () => void
  onSuccess: () => void
  onToast: (m: string, s: string) => void
}) {
  const [motivo, setMotivo] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const confirmar = async () => {
    if (!motivo.trim()) {
      onToast("Revisar formulario", "El motivo de adjudicación es obligatorio")
      return
    }
    setSubmitting(true)
    try {
      await adjudicarProceso(idProceso, {
        id_cotizacion: cotizacion.id_cotizacion,
        motivo_adjudicacion: motivo.trim(),
      })
      onSuccess()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo adjudicar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.52)", backdropFilter: "blur(1.5px)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
        style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: G }}
          >
            <Icons.CheckBadge />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-none">Confirmar Adjudicación</h2>
            <p className="text-xs text-gray-500 mt-0.5">{cotizacion.numero_cotizacion}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            <Icons.X />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border p-4 flex items-start gap-4" style={{ backgroundColor: GL, borderColor: GB }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
              <Icons.Dependencias />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{cotizacion.razon_social}</p>
              <p className="text-xs text-gray-500">{cotizacion.nit}</p>
              <p className="text-lg font-extrabold mt-1" style={{ color: G }}>
                {fmt(cotizacion.monto_total)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item) => {
              const cell = cotizacion.items.find((x) => x && x.id_detalle_requisicion === item.id_detalle) ?? null
              return (
                <div
                  key={item.id_detalle}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
                >
                  <span className="text-gray-700 font-medium">
                    {item.insumo_nombre ?? item.descripcion_libre}
                  </span>
                  <span className="font-bold font-mono text-gray-900">
                    {cell ? fmt(cell.subtotal) : "—"}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Motivo de Adjudicación *
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Justifique la selección de esta oferta (precio, tiempo, cumplimiento técnico)…"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none focus:border-green-600"
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed rounded-lg px-3 py-2.5 bg-amber-50 border border-amber-100">
            <Icons.Warning />
            Esta acción generará una Orden de Compra oficial y notificará al proveedor y a DAFIM.
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={submitting || !motivo.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
            style={{ backgroundColor: G }}
          >
            <Icons.CheckMark />
            {submitting ? "Adjudicando…" : "Adjudicar y Generar Orden de Compra"}
          </button>
        </div>
      </div>
    </div>
  )
}
