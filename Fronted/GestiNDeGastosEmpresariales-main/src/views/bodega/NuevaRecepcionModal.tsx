import { useEffect, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  buscarOrdenPorSolicitud,
  obtenerItemsOrdenCompra,
  recibirTodo,
  type OrdenCompraBusqueda,
  type OrdenCompraItems,
} from "@/api/bodega"
import { ApiError } from "@/api/client"

const fmt = (n: number | string) =>
  Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })

export default function NuevaRecepcionModal({
  onClose,
  onSuccess,
  onToast,
}: {
  onClose: () => void
  onSuccess: () => void
  onToast: (m: string, s: string) => void
}) {
  const [resultados, setResultados] = useState<OrdenCompraBusqueda[]>([])
  const [idOC, setIdOC] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [detalle, setDetalle] = useState<OrdenCompraItems | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [recibidos, setRecibidos] = useState<Set<number>>(new Set())

  const cargar = (q = "") => {
    if (!q.trim()) return
    setBuscando(true)
    setResultados([])
    buscarOrdenPorSolicitud(q)
      .then(setResultados)
      .catch(() => onToast("Error", "No se pudo buscar el pedido"))
      .finally(() => setBuscando(false))
  }

  useEffect(() => {
    if (idOC == null) {
      setDetalle(null)
      setRecibidos(new Set())
      return
    }
    setCargandoDetalle(true)
    obtenerItemsOrdenCompra(idOC)
      .then((d) => {
        setDetalle(d)
        setRecibidos(new Set(d.items.filter((it) => !it.ya_recibido).map((it) => it.id_detalle_orden)))
      })
      .catch(() => setDetalle(null))
      .finally(() => setCargandoDetalle(false))
  }, [idOC])

  const toggleRecibido = (id: number) => {
    setRecibidos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const recibir = async () => {
    if (idOC == null) {
      onToast("Revisar formulario", "Seleccione un pedido")
      return
    }
    if (!detalle) return
    const pendientes = detalle.items.filter((it) => !it.ya_recibido)
    const total = pendientes.length
    const marcados = pendientes.filter((it) => recibidos.has(it.id_detalle_orden)).length
    const completo = marcados === total
    const msg = completo
      ? "Se recibió todo el pedido. Se marcará como Completado."
      : `Solo ${marcados} de ${total} ítems recibidos. Se marcará como Pendiente.`
    if (!window.confirm(`¿Confirmar recepción? ${msg}`)) return
    setSubmitting(true)
    try {
      await recibirTodo({ id_orden_compra: idOC, items_recibidos: Array.from(recibidos) })
      if (completo) {
        onToast("Pedido completado", "El pedido fue marcado como Entregado en todos los módulos.")
      } else {
        onToast("Recepción pendiente", "Quedaron ítems pendientes de entrega.")
      }
      onSuccess()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo recibir el pedido")
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
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Buscar Pedido por Código SC</label>
            <div className="flex gap-2">
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && cargar(busqueda)}
                placeholder="Código de solicitud (ej. SC-2026-021)"
                className="flex-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
              <button onClick={() => cargar(busqueda)} className="px-4 py-2.5 text-sm font-bold text-white rounded-lg" style={{ backgroundColor: G }}>
                Buscar
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-60 overflow-y-auto">
            {buscando && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">Buscando pedidos...</p>
            )}
            {!buscando && resultados.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">Ingrese un código SC para buscar el pedido.</p>
            )}
            {resultados.map((o) => (
              <button
                key={o.id_orden_compra}
                onClick={() => setIdOC(o.id_orden_compra)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                style={{ backgroundColor: o.id_orden_compra === idOC ? GL : undefined }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{o.codigo_requisicion}</p>
                  <p className="text-xs text-gray-500">{o.razon_social} · {o.nit} · {o.estado}</p>
                </div>
              </button>
            ))}
          </div>

          {cargandoDetalle && (
            <p className="text-sm text-gray-500 text-center py-2">Cargando detalle del pedido...</p>
          )}

          {detalle && (
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold text-gray-900">{detalle.codigo_requisicion}</p>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">{detalle.estado}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-gray-200 p-2">
                  <p className="text-gray-400">Tipo</p>
                  <p className="font-bold text-gray-800">{detalle.tipo_solicitud}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-2">
                  <p className="text-gray-400">Proveedor</p>
                  <p className="font-bold text-gray-800">{detalle.razon_social}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-2">
                  <p className="text-gray-400">NIT</p>
                  <p className="font-bold text-gray-800">{detalle.nit}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Ítems del Pedido</p>
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-50">
                  {detalle.items.map((it) => {
                    if (it.ya_recibido) {
                      return (
                        <div key={it.id_detalle_orden} className="flex items-center justify-between px-3 py-2 bg-green-50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded border-2 bg-green-500 border-green-500 text-white flex items-center justify-center shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            <span className="text-sm font-semibold text-green-800">{it.descripcion}</span>
                          </div>
                          <span className="text-xs font-bold text-green-700 shrink-0">Recibido</span>
                        </div>
                      )
                    }
                    const marcado = recibidos.has(it.id_detalle_orden)
                    return (
                      <div
                        key={it.id_detalle_orden}
                        onClick={() => toggleRecibido(it.id_detalle_orden)}
                        className="flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${marcado ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}
                          >
                            {marcado && (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span className={`text-sm font-semibold ${marcado ? "text-green-800" : "text-gray-500 line-through"}`}>
                            {it.descripcion}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-gray-600 shrink-0">
                          {Number(it.cantidad_comprada).toLocaleString("es-GT")} {it.unidad_simbolo}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {detalle.items.filter((it) => !it.ya_recibido).filter((it) => recibidos.has(it.id_detalle_orden)).length} de {detalle.items.filter((it) => !it.ya_recibido).length} ítems por recibir
                </p>
              </div>

              {detalle.lugar_entrega && (
                <p className="text-xs text-gray-500">Lugar de entrega: {detalle.lugar_entrega}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button onClick={recibir} disabled={submitting || idOC == null} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm disabled:opacity-50" style={{ backgroundColor: "#16A34A" }}>
            <Icons.CheckMark />
            {submitting ? "Recibiendo..." : "Recibido"}
          </button>
        </div>
      </div>
    </div>
  )
}
