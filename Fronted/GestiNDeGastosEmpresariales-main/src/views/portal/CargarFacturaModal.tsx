import { useEffect, useRef, useState } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  listarOrdenesFacturables,
  obtenerOrdenFacturable,
  registrarFacturaPortal,
  type OrdenFacturable,
  type OrdenFacturableDetalle,
} from "@/api/portal"
import { ApiError } from "@/api/client"

const fmtQ = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

const fmtMonto = (n: number | string) => (Number(n || 0) > 0 ? fmtQ(n) : "—")

function fmtFecha(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-GT")
}

function hoyISO() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function CargarFacturaModal({
  onClose,
  onToast,
  onSuccess,
  initialIdOC,
  nit,
}: {
  onClose: () => void
  onToast: (m: string, s: string) => void
  onSuccess: () => void
  initialIdOC?: number | null
  nit?: string
}) {
  const [ordenes, setOrdenes] = useState<OrdenFacturable[]>([])
  const [loadingOrdenes, setLoadingOrdenes] = useState(true)
  const [idOC, setIdOC] = useState<number | null>(null)
  const [detalle, setDetalle] = useState<OrdenFacturableDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [serie, setSerie] = useState("")
  const [numeroFactura, setNumeroFactura] = useState("")
  const [fechaEmision, setFechaEmision] = useState("")
  const [montoTotal, setMontoTotal] = useState("")
  const [plazoCredito, setPlazoCredito] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listarOrdenesFacturables()
      .then((ords) => {
        setOrdenes(ords)
        // Si no hay orden preseleccionada y hay exactamente una proforma pendiente, auto-seleccionarla.
        if (initialIdOC == null) {
          const proformas = ords.filter((o) => o.es_proforma)
          if (proformas.length === 1) setIdOC(proformas[0].id_orden_compra)
        }
      })
      .catch((e) => onToast("Error", e instanceof ApiError ? e.message : "No se pudieron cargar las órdenes"))
      .finally(() => setLoadingOrdenes(false))
  }, [onToast])

  useEffect(() => {
    if (initialIdOC != null) setIdOC(initialIdOC)
  }, [initialIdOC])

  useEffect(() => {
    if (idOC == null) {
      setDetalle(null)
      return
    }
    setLoadingDetalle(true)
    obtenerOrdenFacturable(idOC)
      .then((d) => {
        setDetalle(d)
        // Si viene de proforma, prellenar monto adjudicado, fecha de hoy y plazo de crédito.
        if (d.es_proforma) {
          setMontoTotal(d.monto_adjudicado)
          setFechaEmision(hoyISO())
          if (d.plazo_credito_dias != null) setPlazoCredito(String(d.plazo_credito_dias))
        }
      })
      .catch(() => setDetalle(null))
      .finally(() => setLoadingDetalle(false))
  }, [idOC])

  const handleSubmit = async () => {
    if (idOC == null) {
      onToast("Revisar formulario", "Seleccione una orden de compra")
      return
    }
    if (!numeroFactura.trim()) {
      onToast("Revisar formulario", "El número de factura es requerido")
      return
    }
    if (!fechaEmision) {
      onToast("Revisar formulario", "La fecha de emisión es requerida")
      return
    }
    if (!(parseFloat(montoTotal) > 0)) {
      onToast("Revisar formulario", "El monto debe ser mayor que 0")
      return
    }

    setSubmitting(true)
    try {
      let pdfBase64: string | undefined
      let pdfNombre: string | undefined
      if (pdfFile) {
        pdfBase64 = await fileToBase64(pdfFile)
        pdfNombre = pdfFile.name
      }

      await registrarFacturaPortal({
        id_orden_compra: idOC,
        serie: serie.trim() || undefined,
        numero_factura: numeroFactura.trim(),
        fecha_emision: fechaEmision,
        monto_total: parseFloat(montoTotal),
        plazo_credito_dias: plazoCredito ? parseInt(plazoCredito, 10) : undefined,
        observaciones: observaciones.trim() || undefined,
        archivo_pdf_nombre: pdfNombre,
        archivo_pdf_base64: pdfBase64,
      })

      onToast("Factura enviada", "La factura fue registrada correctamente y enviada a revisión.")
      onSuccess()
      onClose()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo registrar la factura")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.52)", backdropFilter: "blur(1px)" }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: G }}>
              <Icons.Facturacion />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Cargar Factura</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
            <Icons.X />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Orden de Compra</label>
            {loadingOrdenes ? (
              <p className="text-sm text-gray-400 mt-2">Cargando órdenes...</p>
            ) : (
              <select
                value={idOC ?? ""}
                onChange={(e) => setIdOC(Number(e.target.value) || null)}
                className="w-full mt-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              >
                <option value="">Seleccione una orden de compra</option>
                {ordenes.map((o) => {
                  const disponible = Number(o.recibido_valorizado) - Number(o.total_facturado)
                  return (
                    <option key={o.id_orden_compra} value={o.id_orden_compra}>
                      {o.numero_orden} · {o.codigo_requisicion} · Disponible: {fmtMonto(disponible)}
                    </option>
                  )
                })}
              </select>
            )}
            {loadingDetalle && (
              <p className="text-xs text-gray-400 mt-2">Cargando detalle…</p>
            )}
            {detalle && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
                {detalle.es_proforma && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                      <Icons.CheckBadge /> Proforma
                    </span>
                    <span className="text-xs font-mono text-gray-600">{detalle.numero_cotizacion}</span>
                    <span className="text-xs text-gray-400">· monto adjudicado {fmtMonto(detalle.monto_adjudicado)}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Solicitud</p>
                    <p className="font-bold text-gray-800">{detalle.codigo_requisicion}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Dependencia</p>
                    <p className="font-bold text-gray-800">{detalle.nombre_dependencia}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Tipo</p>
                    <p className="font-bold text-gray-800">{detalle.tipo_solicitud}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Fecha Orden</p>
                    <p className="font-bold text-gray-800">{fmtFecha(detalle.fecha_emision)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-gray-200 bg-white p-2">
                    <p className="text-gray-400">Monto OC</p>
                    <p className="font-bold text-gray-800">{fmtMonto(detalle.monto_total)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-2">
                    <p className="text-gray-400">Recibido</p>
                    <p className="font-bold text-gray-800">{fmtMonto(detalle.recibido_valorizado)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-2">
                    <p className="text-gray-400">Disponible</p>
                    <p className="font-bold text-green-700">{fmtMonto(Number(detalle.recibido_valorizado) - Number(detalle.total_facturado))}</p>
                  </div>
                </div>

                {detalle.justificacion && (
                  <p className="text-xs text-gray-600 leading-relaxed">{detalle.justificacion}</p>
                )}

                {detalle.items.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                    {detalle.items.map((it) => (
                      <div key={it.id_detalle_orden} className="px-3 py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800 truncate">{it.descripcion}</p>
                          <p className="text-[11px] text-gray-500">
                            {Number(it.cantidad_comprada).toLocaleString("es-GT")} {it.unidad_simbolo}
                            {Number(it.cantidad_recibida) > 0 ? ` · Recibido: ${Number(it.cantidad_recibida).toLocaleString("es-GT")}` : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold font-mono text-gray-900">{fmtMonto(it.subtotal)}</p>
                          {Number(it.precio_unitario) > 0 && (
                            <p className="text-[10px] text-gray-400 font-mono">{fmtQ(it.precio_unitario)} c/u</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Serie</label>
              <input
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                placeholder="Ej. A, B, C"
                className="w-full mt-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Número de Factura</label>
              <input
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                placeholder="00012345"
                className="w-full mt-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">NIT</label>
              <input
                value={nit ?? ""}
                readOnly
                className="w-full mt-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fecha de Emisión</label>
              <input
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Monto Total</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                placeholder="0.00"
                className="w-full mt-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Plazo Crédito (días)</label>
              <input
                type="number"
                min="0"
                value={plazoCredito}
                onChange={(e) => setPlazoCredito(e.target.value)}
                placeholder="0"
                className="w-full mt-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Notas adicionales..."
              className="w-full mt-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Archivo PDF</label>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            />
            <button
              onClick={() => pdfInputRef.current?.click()}
              className="w-full mt-1 flex items-center gap-2 px-3 py-2.5 text-sm border border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
            >
              <Icons.PDF />
              <span className="truncate text-gray-600">
                {pdfFile ? pdfFile.name : "Seleccionar PDF..."}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
            style={{ backgroundColor: G }}
          >
            <Icons.Plus />
            {submitting ? "Enviando..." : "Enviar Factura"}
          </button>
        </div>
      </div>
    </div>
  )
}
