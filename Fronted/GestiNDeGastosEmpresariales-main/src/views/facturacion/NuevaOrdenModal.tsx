import { useEffect, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  listarFacturas,
  listarPartidas,
  listarFuentes,
  crearOrdenPago,
  type Factura,
  type Partida,
  type Fuente,
} from "@/api/facturacion"
import { ApiError } from "@/api/client"

const fmt = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

export default function NuevaOrdenModal({
  onClose,
  onSuccess,
  onToast,
}: {
  onClose: () => void
  onSuccess: () => void
  onToast: (m: string, s: string) => void
}) {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [partidas, setPartidas] = useState<Partida[]>([])
  const [fuentes, setFuentes] = useState<Fuente[]>([])
  const [idFactura, setIdFactura] = useState<number | null>(null)
  const [concepto, setConcepto] = useState("")
  const [monto, setMonto] = useState("")
  const [idPartida, setIdPartida] = useState("")
  const [idFuente, setIdFuente] = useState("")
  const [fechaVencimiento, setFechaVencimiento] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listarFacturas()
      .then((f) => setFacturas(f.filter((x) => x.estado === "Aprobada" && !x.estado_pago)))
      .catch(() => onToast("Error", "No se pudieron cargar las facturas aprobadas"))
    listarPartidas().then(setPartidas).catch(() => {})
    listarFuentes().then(setFuentes).catch(() => {})
  }, [onToast])

  const facturaSel = facturas.find((f) => f.id_factura === idFactura) ?? null

  const elegirFactura = (f: Factura) => {
    setIdFactura(f.id_factura)
    setConcepto(f.numero_orden ? `Pago de factura ${f.numero_factura} (${f.numero_orden})` : `Pago de factura ${f.numero_factura}`)
    setMonto(f.monto_total)
    setFechaVencimiento(f.fecha_vencimiento)
  }

  const enviar = async () => {
    if (idFactura == null) {
      onToast("Revisar formulario", "Seleccione la factura aprobada")
      return
    }
    if (!concepto.trim()) {
      onToast("Revisar formulario", "El concepto es obligatorio")
      return
    }
    if (!(parseFloat(monto) > 0)) {
      onToast("Revisar formulario", "El monto debe ser mayor que 0")
      return
    }
    setSubmitting(true)
    try {
      await crearOrdenPago({
        id_factura: idFactura,
        concepto: concepto.trim(),
        monto: parseFloat(monto),
        id_partida: idPartida ? Number(idPartida) : undefined,
        id_fuente: idFuente ? Number(idFuente) : undefined,
        fecha_vencimiento: fechaVencimiento || undefined,
      })
      onToast("Orden de pago creada", "La orden de pago quedó en estado Pendiente.")
      onSuccess()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo crear la orden de pago")
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col"
        style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
            <Icons.Facturacion />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-none">Nueva Orden de Pago</h2>
            <p className="text-xs text-gray-500 mt-0.5">Se crea desde una factura aprobada</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
            <Icons.X />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Factura Aprobada *</label>
            <select
              value={idFactura ?? ""}
              onChange={(e) => elegirFactura(facturas.find((f) => f.id_factura === Number(e.target.value))!)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
            >
              <option value="" disabled>Seleccione la factura…</option>
              {facturas.map((f) => (
                <option key={f.id_factura} value={f.id_factura}>
                  {f.numero_factura} · {f.razon_social} ({fmt(f.monto_total)})
                </option>
              ))}
            </select>
            {facturas.length === 0 && (
              <p className="text-xs text-gray-400">No hay facturas aprobadas sin orden de pago.</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">Concepto *</label>
            <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Descripción del pago" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-600 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Monto (Q) *</label>
              <input value={monto} onChange={(e) => setMonto(e.target.value)} type="number" step="0.01" placeholder="0.00" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-600 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Fecha de Vencimiento</label>
              <input value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} type="date" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-600 transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Partida Presupuestaria</label>
              <select value={idPartida} onChange={(e) => setIdPartida(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600">
                <option value="">Sin partida</option>
                {partidas.map((p) => (
                  <option key={p.id_partida} value={p.id_partida}>{p.codigo} · {p.descripcion}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">Fuente de Financiamiento</label>
              <select value={idFuente} onChange={(e) => setIdFuente(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600">
                <option value="">Sin fuente</option>
                {fuentes.map((f) => (
                  <option key={f.id_fuente} value={f.id_fuente}>{f.codigo} · {f.descripcion}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button onClick={enviar} disabled={submitting} className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50" style={{ backgroundColor: G }}>
            {submitting ? "Creando…" : "Crear Orden de Pago"}
          </button>
        </div>
      </div>
    </div>
  )
}
