import { useEffect, useRef, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  obtenerProceso,
  registrarCotizacion,
  type Proceso,
  type ProcesoDetalleItem,
} from "@/api/proformas"
import { ApiError } from "@/api/client"

interface FilaDraft {
  id_detalle_requisicion: number
  cantidad: string
  precio_unitario: string
}

export default function RegistrarCotizacionModal({
  proceso,
  onClose,
  onSuccess,
  onToast,
}: {
  proceso: Proceso
  onClose: () => void
  onSuccess: () => void
  onToast: (m: string, s: string) => void
}) {
  const [items, setItems] = useState<ProcesoDetalleItem[]>([])
  const [invitados, setInvitados] = useState<Array<{ id_proveedor: number; razon_social: string; nit: string }>>([])
  const [idProveedor, setIdProveedor] = useState<number | null>(null)
  const [condicionesPago, setCondicionesPago] = useState("")
  const [tiempoEntrega, setTiempoEntrega] = useState("")
  const [filas, setFilas] = useState<FilaDraft[]>([])
  const [submitting, setSubmitting] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    obtenerProceso(proceso.id_proceso)
      .then((d) => {
        setItems(d.items)
        setInvitados(d.invitados)
        setFilas(
          d.items.map((it) => ({
            id_detalle_requisicion: it.id_detalle,
            cantidad: it.cantidad,
            precio_unitario: "",
          })),
        )
      })
      .catch(() => onToast("Error", "No se pudieron cargar los ítems"))
  }, [proceso.id_proceso, onToast])

  const updateFila = (idDetalle: number, patch: Partial<FilaDraft>) => {
    setFilas((prev) =>
      prev.map((f) => (f.id_detalle_requisicion === idDetalle ? { ...f, ...patch } : f)),
    )
  }

  const enviar = async () => {
    if (idProveedor == null) {
      onToast("Revisar formulario", "Seleccione el proveedor")
      return
    }
    for (const f of filas) {
      if (!(parseFloat(f.precio_unitario) >= 0)) {
        onToast("Revisar formulario", "Ingrese el precio de cada ítem")
        return
      }
    }
    setSubmitting(true)
    try {
      await registrarCotizacion(proceso.id_proceso, {
        id_proveedor: idProveedor,
        condiciones_pago: condicionesPago.trim() || undefined,
        tiempo_entrega_dias: tiempoEntrega ? parseInt(tiempoEntrega) : undefined,
        items: filas.map((f) => ({
          id_detalle_requisicion: f.id_detalle_requisicion,
          cantidad: parseFloat(f.cantidad) || 0,
          precio_unitario: parseFloat(f.precio_unitario) || 0,
        })),
      })
      onToast("Cotización registrada", "La proforma fue recibida correctamente.")
      onSuccess()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo registrar la cotización")
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
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: G }}
            >
              <Icons.FileText />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Registrar Cotización</h2>
              <p className="text-xs text-gray-500">{proceso.codigo_requisicion}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            <Icons.X />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Proveedor
            </label>
            <select
              value={idProveedor ?? ""}
              onChange={(e) => setIdProveedor(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
            >
              <option value="" disabled>
                Seleccione el proveedor…
              </option>
              {invitados.map((p) => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.razon_social} ({p.nit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Condiciones de Pago
              </label>
              <input
                value={condicionesPago}
                onChange={(e) => setCondicionesPago(e.target.value)}
                placeholder="Ej. Contado, 30 días…"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Tiempo de Entrega (días)
              </label>
              <input
                type="number"
                min={0}
                value={tiempoEntrega}
                onChange={(e) => setTiempoEntrega(e.target.value)}
                placeholder="Ej. 5"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Ítems Cotizados
            </p>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 overflow-hidden">
              {items.map((it) => {
                const fila = filas.find((f) => f.id_detalle_requisicion === it.id_detalle)
                return (
                  <div key={it.id_detalle} className="px-3 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {it.insumo_nombre ?? it.descripcion_libre}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {it.unidad_nombre} · Cantidad solicitada: {it.cantidad}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Cantidad</label>
                        <input
                          type="number"
                          value={fila?.cantidad ?? it.cantidad}
                          onChange={(e) => updateFila(it.id_detalle, { cantidad: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Precio Unitario (Q)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={fila?.precio_unitario ?? ""}
                          onChange={(e) => updateFila(it.id_detalle, { precio_unitario: e.target.value })}
                          placeholder="0.00"
                          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={enviar}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
            style={{ backgroundColor: G }}
          >
            <Icons.CheckMark />
            {submitting ? "Guardando…" : "Registrar Cotización"}
          </button>
        </div>
      </div>
    </div>
  )
}
