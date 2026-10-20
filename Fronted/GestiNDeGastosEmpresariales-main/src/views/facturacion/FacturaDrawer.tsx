import { useEffect, useRef, useState } from "react"
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
  "Pagado con atraso": { bg: "#FDE68A", color: "#92400E" },
  Pendiente: { bg: "#FEF9C3", color: "#854D0E" },
  Vencido: { bg: "#FEE2E2", color: "#DC2626" },
  Rechazada: { bg: "var(--gray-100)", color: "#64748B" },
}

const fmt = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

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
  const [showAprobar, setShowAprobar] = useState(false)
  const [npg, setNpg] = useState("")
  const [npgFile, setNpgFile] = useState<File | null>(null)
  const npgInputRef = useRef<HTMLInputElement>(null)
  const [pdfViewer, setPdfViewer] = useState<{ src: string; nombre: string } | null>(null)

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
    if (a === "aprobar") {
      if (!npg.trim()) {
        onToast("Revisar formulario", "El número de NPG es obligatorio")
        return
      }
      if (!npgFile) {
        onToast("Revisar formulario", "Debe cargar el PDF del NPG")
        return
      }
    }
    setWorking(true)
    try {
      const payload: Record<string, string | undefined> = {
        motivo_rechazo: a === "rechazar" ? motivo.trim() : undefined,
      }
      if (a === "aprobar") {
        payload.npg = npg.trim()
        payload.archivo_npg_pdf_nombre = npgFile!.name
        payload.archivo_npg_pdf_base64 = await fileToBase64(npgFile!)
      }
      await revisarFactura(facturaId, a, payload)
      onToast(
        "Factura actualizada",
        a === "aprobar" ? "La factura fue aprobada y quedó pagada." : `La factura pasó a ${a === "iniciar" ? "En Revisión" : "Rechazada"}.`,
      )
      setShowRechazo(false)
      setShowAprobar(false)
      setMotivo("")
      setNpg("")
      setNpgFile(null)
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
        await pagarOrdenPago(op.id_orden_pago, { fecha_pago_real: new Date().toISOString().slice(0, 10) })
        onToast("Pago registrado", "La orden quedó Pagada.")
      } else {
        const motivo = "Anulación solicitada desde facturación"
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

              {factura.codigo_requisicion && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Solicitud / Orden</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Solicitud</p>
                      <p className="text-sm font-bold text-gray-900">{factura.codigo_requisicion}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Dependencia</p>
                      <p className="text-sm font-bold text-gray-900">{factura.nombre_dependencia}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Tipo</p>
                      <p className="text-sm font-bold text-gray-900">{factura.tipo_solicitud}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Fecha Orden</p>
                      <p className="text-sm font-bold text-gray-900">{factura.oc_fecha_emision ?? "—"}</p>
                    </div>
                  </div>
                  {factura.justificacion && <p className="text-xs text-gray-600 mt-2">{factura.justificacion}</p>}
                </div>
              )}

              {factura.items && factura.items.length > 0 && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ítems de la Orden</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {factura.items.map((it) => (
                      <div key={it.id_detalle_orden} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{it.descripcion}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {Number(it.cantidad_comprada).toLocaleString("es-GT")} {it.unidad_simbolo}
                            {Number(it.cantidad_recibida) > 0 ? ` · Recibido: ${Number(it.cantidad_recibida).toLocaleString("es-GT")}` : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold font-mono text-gray-900">{fmt(it.subtotal)}</p>
                          {Number(it.precio_unitario) > 0 && (
                            <p className="text-[11px] text-gray-400 font-mono">{fmt(it.precio_unitario)} c/u</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {factura.observaciones && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Observaciones</p>
                  <p className="text-sm text-gray-800 mt-1">{factura.observaciones}</p>
                </div>
              )}

              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Documento de la Factura</p>
                {factura.archivo_pdf_base64 ? (
                  <button
                    onClick={() => setPdfViewer({ src: factura.archivo_pdf_base64!, nombre: factura.archivo_pdf_nombre ?? "Factura.pdf" })}
                    className="mt-2 flex items-center gap-2 px-3 py-2 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: G }}
                  >
                    <Icons.PDF /> Ver PDF
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">El proveedor no adjuntó PDF.</p>
                )}
              </div>

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
                    Estado: {factura.orden_pago.pagado_atraso ? "Pagada con atraso" : factura.orden_pago.estado} · {fmt(factura.orden_pago.monto)}
                  </p>
                </div>
              )}

              {factura.npg && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">NPG</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{factura.npg}</p>
                    </div>
                    {factura.npg_pdf_base64 && (
                      <button
                        onClick={() => setPdfViewer({ src: factura.npg_pdf_base64!, nombre: factura.npg_pdf_nombre ?? "NPG.pdf" })}
                        className="shrink-0 flex items-center gap-2 px-3 py-2 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90"
                        style={{ backgroundColor: G }}
                      >
                        <Icons.PDF /> Ver PDF
                      </button>
                    )}
                  </div>
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
                    <button onClick={() => setShowAprobar(true)} disabled={working} className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: G }}>
                      <Icons.CheckMark /> Aprobar
                    </button>
                    <button onClick={() => setShowRechazo(true)} disabled={working} className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: "#DC2626" }}>
                      <Icons.X /> Rechazar
                    </button>
                  </>
                )}
                {factura.orden_pago && factura.orden_pago.estado === "Pendiente" && (
                  <>
                    <button onClick={() => pagoAccion("pagar")} disabled={working} className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: G }}>
                      <Icons.CheckMark /> Registrar Pago
                    </button>
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

            {showAprobar && (
              <div className="border-t border-gray-100 px-6 py-4 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Número de NPG</label>
                  <input
                    value={npg}
                    onChange={(e) => setNpg(e.target.value)}
                    placeholder="NPG"
                    className="w-full mt-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">PDF del NPG</label>
                  <input
                    ref={npgInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setNpgFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    onClick={() => npgInputRef.current?.click()}
                    className="w-full mt-1 flex items-center gap-2 px-3 py-2.5 text-sm border border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
                  >
                    <Icons.PDF />
                    <span className="truncate text-gray-600">
                      {npgFile ? npgFile.name : "Seleccionar PDF del NPG..."}
                    </span>
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowAprobar(false)} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                    Cancelar
                  </button>
                  <button onClick={() => accion("aprobar")} disabled={working || !npg.trim() || !npgFile} className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: G }}>
                    Confirmar Aprobar
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-red-500">No se pudo cargar la factura.</div>
        )}
      </div>

      {pdfViewer && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(2px)" }}
          onClick={() => setPdfViewer(null)}
        >
          <div
            className="rounded-xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Icons.PDF />
                <span className="text-sm font-bold text-gray-800 truncate">{pdfViewer.nombre}</span>
              </div>
              <button onClick={() => setPdfViewer(null)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                <Icons.X />
              </button>
            </div>
            <iframe src={pdfViewer.src} className="w-full flex-1 border-0" title={pdfViewer.nombre} />
          </div>
        </div>
      )}
    </>
  )
}
