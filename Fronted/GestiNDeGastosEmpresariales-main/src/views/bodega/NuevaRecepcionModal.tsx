import { useEffect, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  listarOrdenesCompraRecepcion,
  crearRecepcion,
  type OrdenCompraRecepcion,
  type Recepcion,
} from "@/api/bodega"
import { ApiError } from "@/api/client"

const fmt = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

export default function NuevaRecepcionModal({
  onClose,
  onSuccess,
  onToast,
}: {
  onClose: () => void
  onSuccess: (recepcion: Recepcion) => void
  onToast: (m: string, s: string) => void
}) {
  const [ocs, setOcs] = useState<OrdenCompraRecepcion[]>([])
  const [idOC, setIdOC] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const cargar = (q = "") => {
    listarOrdenesCompraRecepcion(q ? { numero: q } : {})
      .then(setOcs)
      .catch(() => onToast("Error", "No se pudieron cargar las órdenes de compra"))
  }

  useEffect(() => {
    cargar()
  }, [])

  const ocSel = ocs.find((o) => o.id_orden_compra === idOC) ?? null

  const crear = async () => {
    if (idOC == null) {
      onToast("Revisar formulario", "Seleccione una orden de compra")
      return
    }
    setSubmitting(true)
    try {
      const recepcion = await crearRecepcion({ id_orden_compra: idOC })
      onToast("Recepción creada", "La orden quedó en En Proceso. Verifique los ítems.")
      onSuccess(recepcion)
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo crear la recepción")
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col"
        style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: G }}>
              <Icons.PackagePlus />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Nueva Recepción</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
            <Icons.X />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Buscar Orden de Compra</label>
            <div className="flex gap-2">
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && cargar(busqueda)}
                placeholder="Número de orden (ej. OC-2026-001)"
                className="flex-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
              <button onClick={() => cargar(busqueda)} className="px-4 py-2.5 text-sm font-bold text-white rounded-lg" style={{ backgroundColor: G }}>
                Buscar
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {ocs.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No hay órdenes pendientes de recepción.</p>
            )}
            {ocs.map((o) => (
              <button
                key={o.id_orden_compra}
                onClick={() => setIdOC(o.id_orden_compra)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                style={{ backgroundColor: o.id_orden_compra === idOC ? GL : undefined }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{o.numero_orden}</p>
                  <p className="text-xs text-gray-500">{o.razon_social} · {o.nit}</p>
                </div>
                <span className="text-sm font-bold font-mono text-gray-700 shrink-0">{fmt(o.monto_total)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button onClick={crear} disabled={submitting || idOC == null} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm disabled:opacity-50" style={{ backgroundColor: G }}>
            <Icons.Plus />
            {submitting ? "Creando…" : "Crear Recepción"}
          </button>
        </div>
      </div>
    </div>
  )
}
