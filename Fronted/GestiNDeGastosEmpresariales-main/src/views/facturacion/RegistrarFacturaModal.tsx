import { useEffect, useRef, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  listarOrdenesCompraFacturables,
  registrarFactura,
  type OrdenCompraFacturable,
} from "@/api/facturacion"
import { ApiError } from "@/api/client"

const fmt = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

export default function RegistrarFacturaModal({
  onClose,
  onSuccess,
  onToast,
}: {
  onClose: () => void
  onSuccess: () => void
  onToast: (m: string, s: string) => void
}) {
  const [ocs, setOcs] = useState<OrdenCompraFacturable[]>([])
  const [idOC, setIdOC] = useState<number | null>(null)
  const [serie, setSerie] = useState("")
  const [numeroFactura, setNumeroFactura] = useState("")
  const [numeroAutorizacion, setNumeroAutorizacion] = useState("")
  const [npg, setNpg] = useState("")
  const [fechaEmision, setFechaEmision] = useState("")
  const [monto, setMonto] = useState("")
  const [plazo, setPlazo] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listarOrdenesCompraFacturables()
      .then(setOcs)
      .catch(() => onToast("Error", "No se pudieron cargar las órdenes de compra"))
  }, [onToast])

  const ocSel = ocs.find((o) => o.id_orden_compra === idOC) ?? null

  const elegirOC = (oc: OrdenCompraFacturable) => {
    setIdOC(oc.id_orden_compra)
    if (oc.plazo_credito_dias != null) setPlazo(String(oc.plazo_credito_dias))
  }

  const disponible = ocSel ? Number(ocSel.monto_total) - Number(ocSel.total_facturado) : 0

  const enviar = async () => {
    if (idOC == null) {
      onToast("Revisar formulario", "Seleccione la orden de compra")
      return
    }
    if (!numeroFactura.trim()) {
      onToast("Revisar formulario", "El número de factura es obligatorio")
      return
    }
    if (!fechaEmision) {
      onToast("Revisar formulario", "La fecha de emisión es obligatoria")
      return
    }
    if (!(parseFloat(monto) > 0)) {
      onToast("Revisar formulario", "El monto debe ser mayor que 0")
      return
    }
    setSubmitting(true)
    try {
      await registrarFactura({
        id_orden_compra: idOC,
        serie: serie.trim() || undefined,
        numero_factura: numeroFactura.trim(),
        numero_autorizacion: numeroAutorizacion.trim() || undefined,
        npg: npg.trim() || undefined,
        fecha_emision: fechaEmision,
        monto_total: parseFloat(monto),
        plazo_credito_dias: plazo ? parseInt(plazo) : undefined,
        observaciones: observaciones.trim() || undefined,
      })
      onToast("Factura registrada", "La factura quedó en estado Recibida para revisión.")
      onSuccess()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo registrar la factura")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
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
            <h2 className="text-lg font-bold text-gray-900">Registrar Factura</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
            <Icons.X />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Orden de Compra
            </label>
            <select
              value={idOC ?? ""}
              onChange={(e) => elegirOC(ocs.find((o) => o.id_orden_compra === Number(e.target.value))!)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
            >
              <option value="" disabled>Seleccione la orden de compra…</option>
              {ocs.map((o) => (
                <option key={o.id_orden_compra} value={o.id_orden_compra}>
                  {o.numero_orden} · {o.razon_social} ({fmt(Number(o.monto_total) - Number(o.total_facturado))} disponible)
                </option>
              ))}
            </select>
            {ocSel && (
              <p className="text-xs text-gray-500">
                Proveedor: <b>{ocSel.razon_social}</b> ({ocSel.nit}) · Monto pendiente: {fmt(disponible)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Serie</label>
              <input value={serie} onChange={(e) => setSerie(e.target.value)} placeholder="Ej. FEL" className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Número de Factura *</label>
              <input value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} placeholder="Ej. 49201" className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Autorización (FEL)</label>
              <input value={numeroAutorizacion} onChange={(e) => setNumeroAutorizacion(e.target.value)} placeholder="Opcional" className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">NPG (Guatecompras)</label>
              <input value={npg} onChange={(e) => setNpg(e.target.value)} placeholder="Opcional" className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fecha Emisión *</label>
              <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Monto (Q) *</label>
              <input type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Plazo Crédito (días)</label>
              <input type="number" min={0} value={plazo} onChange={(e) => setPlazo(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Observaciones</label>
            <textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none focus:border-green-600" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button onClick={enviar} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm disabled:opacity-50" style={{ backgroundColor: G }}>
            <Icons.CheckMark />
            {submitting ? "Guardando…" : "Registrar Factura"}
          </button>
        </div>
      </div>
    </div>
  )
}
