import { useEffect, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  obtenerFactura,
  revisarFactura,
  programarOrdenPago,
  pagarOrdenPago,
  anularOrdenPago,
  type Factura,
} from "@/api/facturacion"
import { ApiError } from "@/api/client"

const ESTADO_STYLE: Record<string, { bg: string; color: string }> = {
  Pagado: { bg: "#DCFCE7", color: "#16A34A" },
  Pendiente: { bg: "#FEF9C3", color: "#854D0E" },
  Vencido: { bg: "#FEE2E2", color: "#DC2626" },
  Rechazada: { bg: "#F1F5F9", color: "#64748B" },
}

const fmt = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

export default function FacturaDrawer({
  facturaId,
  onClose,
  onToast,
  onChanged,
}: {
  facturaId: number
  onClose: () => void
  onToast: (m: string, s: string) => void
  onChanged: () => void
}) {
  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [showRechazo, setShowRechazo] = useState(false)
  const [working, setWorking] = useState(false)

  const cargar = async () => {
    try {
      const d = await obtenerFactura(facturaId)
      setFactura(d)
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cargar la factura")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    const t = setTimeout(() => setOpen(true), 10)
    return () => clearTimeout(t)
  }, [facturaId])

  const handleClose = () => {
    setOpen(false)
    setTimeout(onClose, 300)
  }

  const accion = async (a: "iniciar" | "aprobar" | "rechazar") => {
    if (a === "rechazar" && !motivo.trim()) {
      onToast("Revisar formulario", "El motivo de rechazo es obligatorio")
      return
    }
    setWorking(true)
    try {
      await revisarFactura(facturaId, a, a === "rechazar" ? motivo.trim() : undefined)
      onToast("Factura actualizada", `La factura pasó a ${a === "iniciar" ? "En Revisión" : a === "aprobar" ? "Aprobada" : "Rechazada"}.`)
      setShowRechazo(false)
      setMotivo("")
      await cargar()
      onChanged()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo actualizar")
    } finally {
      setWorking(false)
    }
  }

  const pagoAccion = async (accion: "programar" | "pagar" | "anular") => {
    const op = factura?.orden_pago
    if (!op) return
    setWorking(true)
    try {
      if (accion === "programar") {
        await programarOrdenPago(op.id_orden_pago, { fecha_pago_programada: new Date().toISOString().slice(0, 10) })
        onToast("Pago programado", "La orden quedó Programada.")
      } else if (accion === "pagar") {
        const ref = window.prompt("Referencia del pago (cheque o transferencia):")
        if (!ref) return
        await pagarOrdenPago(op.id_orden_pago, { fecha_pago_real: new Date().toISOString().slice(0, 10), referencia_pago: ref })
        onToast("Pago registrado", "La orden quedó Pagada.")
      } else {
        const motivo = window.prompt("Motivo de anulación:")
        if (!motivo) return
        await anularOrdenPago(op.id_orden_pago, motivo)
        onToast("Orden anulada", "La orden de pago fue anulada.")
      }
      await cargar()
      onChanged()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo actualizar")
    } finally {
      setWorking(false)
    }
  }

  const est = factura ? ESTADO_STYLE[factura.estado_visible] ?? ESTADO_STYLE.Pendiente : ESTADO_STYLE.Pendiente

  return (
    <>
      <div className="fixed inset-0 z-[190]" onClick={handleClose} style={{ backgroundColor: `rgba(0,0,0,${open ? 0.4 : 0})`, transition: "background-color 0.3s" }} />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md z-[195] bg-white shadow-2xl flex flex-col"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s cubic-bezier(.16,1,.3,1)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">Cargando factura…</div>
        ) : factura ? (
          <>
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
                <Icons.Doc />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-extrabold text-gray-900 leading-none">
                  {factura.serie ? `${factura.serie}-` : ""}{factura.numero_factura}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{factura.razon_social}</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: est.bg, color: est.color }}>
                {factura.estado_visible}
              </span>
              <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all ml-1">
                <Icons.X />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "N.° Factura", value: `${factura.serie ? `${factura.serie}-` : ""}${factura.numero_factura}` },
                  { label: "NIT Proveedor", value: factura.nit },
                  { label: "Fecha Emisión", value: factura.fecha_emision },
                  { label: "Monto Total", value: fmt(factura.monto_total), accent: true },
                  { label: "Orden de Compra", value: factura.numero_orden },
                  { label: "Vencimiento", value: factura.fecha_vencimiento },
                ].map((f) => (
                  <div key={f.label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{f.label}</p>
                    <p className={`text-sm font-bold mt-1 ${f.accent ? "" : "text-gray-900"}`} style={f.accent ? { color: G } : {}}>
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>

              {factura.observaciones && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Observaciones</p>
                  <p className="text-sm text-gray-800 mt-1">{factura.observaciones}</p>
                </div>
              )}

              {factura.motivo_rechazo && (
                <div className="rounded-xl px-4 py-3 border" style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}>
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Motivo de Rechazo</p>
                  <p className="text-sm text-red-700 mt-1">{factura.motivo_rechazo}</p>
                </div>
              )}

              {factura.orden_pago && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Orden de Pago</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{factura.orden_pago.numero_orden_pago}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Estado: {factura.orden_pago.estado} · {fmt(factura.orden_pago.monto)}
                  </p>
                </div>
              )}

              <div className="space-y-2.5">
                {factura.estado === "Recibida" && (
                  <button onClick={() => accion("iniciar")} disabled={working} className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: "#0EA5E9" }}>
                    <Icons.Eye /> Iniciar Revisión
                  </button>
                )}
                {factura.estado === "En Revisión" && (
                  <>
                    <button onClick={() => accion("aprobar")} disabled={working} className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: G }}>
                      <Icons.CheckMark /> Aprobar
                    </button>
                    <button onClick={() => setShowRechazo(true)} disabled={working} className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: "#DC2626" }}>
                      <Icons.X /> Rechazar
                    </button>
                  </>
                )}
                {factura.orden_pago && factura.orden_pago.estado === "Pendiente" && (
                  <>
                    <button onClick={() => pagoAccion("programar")} disabled={working} className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: G }}>
                      <Icons.HistoryClock /> Programar Pago
                    </button>
                    <button onClick={() => pagoAccion("anular")} disabled={working} className="w-full py-3 text-sm font-semibold text-red-600 border border-red-200 rounded-xl transition-all hover:bg-red-50 disabled:opacity-50">
                      Anular
                    </button>
                  </>
                )}
                {factura.orden_pago && factura.orden_pago.estado === "Programada" && (
                  <>
                    <button onClick={() => pagoAccion("pagar")} disabled={working} className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: G }}>
                      <Icons.CheckMark /> Registrar Pago
                    </button>
                    <button onClick={() => pagoAccion("anular")} disabled={working} className="w-full py-3 text-sm font-semibold text-red-600 border border-red-200 rounded-xl transition-all hover:bg-red-50 disabled:opacity-50">
                      Anular
                    </button>
                  </>
                )}
              </div>
            </div>

            {showRechazo && (
              <div className="border-t border-gray-100 px-6 py-4 space-y-3">
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Motivo del rechazo…" className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none focus:border-red-400" />
                <div className="flex gap-3">
                  <button onClick={() => setShowRechazo(false)} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                    Cancelar
                  </button>
                  <button onClick={() => accion("rechazar")} disabled={working || !motivo.trim()} className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#DC2626" }}>
                    Confirmar Rechazo
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-red-500">No se pudo cargar la factura.</div>
        )}
      </div>
    </>
  )
}
