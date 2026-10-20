import { useEffect, useState } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  obtenerRecepcion,
  obtenerItemsOrdenCompra,
  ingresarRecepcion,
  recibirTodo,
  cancelarRecepcion,
  type Recepcion,
  type OrdenCompraItems,
} from "@/api/bodega"
import { ApiError } from "@/api/client"

const ESTADO_ITEM_BADGE: Record<string, { bg: string; color: string }> = {
  Recibido: { bg: "#DCFCE7", color: "#16A34A" },
  Rechazado: { bg: "#FEE2E2", color: "#DC2626" },
  Faltante: { bg: "#FEF3C7", color: "#B45309" },
  Pendiente: { bg: "var(--gray-100)", color: "#64748B" },
}

export default function VerificarRecepcionModal({
  recepcion,
  onClose,
  onChanged,
  onToast,
}: {
  recepcion: Recepcion
  onClose: () => void
  onChanged: () => void
  onToast: (m: string, s: string) => void
}) {
  const esEnProceso = recepcion.estado === "En Proceso"
  const esCompleta = recepcion.estado === "Completa"
  const esParcial = recepcion.estado === "Parcial" || recepcion.estado === "Con Novedades"

  const [detalle, setDetalle] = useState<Recepcion | null>(null)
  const [ocDetalle, setOcDetalle] = useState<OrdenCompraItems | null>(null)
  const [marcados, setMarcados] = useState<Set<number>>(new Set())
  const [working, setWorking] = useState(false)

  const cargar = async () => {
    try {
      if (esParcial) {
        const d = await obtenerItemsOrdenCompra(recepcion.id_orden_compra)
        setOcDetalle(d)
        setMarcados(new Set())
      } else {
        const d = await obtenerRecepcion(recepcion.id_recepcion)
        setDetalle(d)
        setMarcados(new Set((d.items ?? []).map((it) => it.id_detalle_recepcion)))
      }
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cargar la recepción")
    }
  }

  useEffect(() => {
    cargar()
  }, [recepcion.id_recepcion, recepcion.estado])

  const toggle = (id: number) => {
    setMarcados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const ingresar = async () => {
    if (!detalle) return
    setWorking(true)
    try {
      const res = await ingresarRecepcion(recepcion.id_recepcion, Array.from(marcados))
      if (res.estado === "Completa") {
        onToast("Ingreso completado", "La recepción quedó completada y la orden pasó a Entregada.")
      } else {
        onToast("Ingreso parcial", "Quedaron ítems pendientes de ingreso.")
      }
      onChanged()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo ingresar")
    } finally {
      setWorking(false)
    }
  }

  const completar = async () => {
    if (!ocDetalle) return
    if (marcados.size === 0) {
      onToast("Marque los ítems", "Seleccione al menos un ítem que ingresó.")
      return
    }
    const faltantes = ocDetalle.items.filter((it) => !it.ya_recibido)
    const total = faltantes.length
    const marcadosCount = faltantes.filter((it) => marcados.has(it.id_detalle_orden)).length
    const completo = marcadosCount === total
    setWorking(true)
    try {
      await recibirTodo({ id_orden_compra: recepcion.id_orden_compra, items_recibidos: Array.from(marcados) })
      if (completo) {
        onToast("Pedido completado", "El pedido quedó Completado en Gestión y en el portal del proveedor.")
      } else {
        onToast("Ingreso parcial", "Quedaron ítems pendientes de ingreso.")
      }
      onChanged()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo completar")
    } finally {
      setWorking(false)
    }
  }

  const cancelar = async () => {
    setWorking(true)
    try {
      await cancelarRecepcion(recepcion.id_recepcion)
      onToast("Recepción cancelada", "La recepción fue cancelada.")
      onChanged()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo cancelar")
    } finally {
      setWorking(false)
    }
  }

  const titulo = esEnProceso ? "Ingreso de ítems" : esCompleta ? "Detalle de Recepción" : "Completar Recepción"

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
              <Icons.Boxes />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{titulo}</h2>
              <p className="text-xs text-gray-500">
                {recepcion.numero_comprobante} · {recepcion.razon_social}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
            <Icons.X />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">
          {esParcial && ocDetalle ? (
            ocDetalle.items.map((it) => {
              if (it.ya_recibido) {
                return (
                  <div key={it.id_detalle_orden} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 h-5 rounded border-2 bg-green-500 border-green-500 text-white flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-sm font-bold text-green-800 leading-snug">{it.descripcion}</p>
                          <p className="text-[11px] text-green-600 mt-0.5">
                            {Number(it.cantidad_comprada).toLocaleString("es-GT")} {it.unidad_simbolo}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 shrink-0">Recibido</span>
                    </div>
                  </div>
                )
              }
              const marcado = marcados.has(it.id_detalle_orden)
              return (
                <div
                  key={it.id_detalle_orden}
                  onClick={() => toggle(it.id_detalle_orden)}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${marcado ? "border-green-300 bg-green-50" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${marcado ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}
                      >
                        {marcado && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <div>
                        <p className={`text-sm font-bold leading-snug ${marcado ? "text-green-800" : "text-gray-400"}`}>
                          {it.descripcion}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${marcado ? "text-green-600" : "text-gray-400"}`}>
                          {Number(it.cantidad_comprada).toLocaleString("es-GT")} {it.unidad_simbolo}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : esCompleta && detalle ? (
            (detalle.items ?? []).map((item) => {
              const badge = ESTADO_ITEM_BADGE[item.estado_item] ?? { bg: "var(--gray-100)", color: "#64748B" }
              return (
                <div key={item.id_detalle_recepcion} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-snug">{item.insumo_nombre}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {item.codigo_insumo} · Esperado: {item.cantidad_esperada} {item.unidad_simbolo}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Recibido: {item.cantidad_recibida} · Aceptado: {item.cantidad_aceptada}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: badge.bg, color: badge.color }}>
                      {item.estado_item}
                    </span>
                  </div>
                </div>
              )
            })
          ) : detalle ? (
            (detalle.items ?? []).map((item) => {
              const marcado = marcados.has(item.id_detalle_recepcion)
              return (
                <div
                  key={item.id_detalle_recepcion}
                  onClick={() => toggle(item.id_detalle_recepcion)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${marcado ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}
                      >
                        {marcado && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <div>
                        <p className={`text-sm font-bold leading-snug ${marcado ? "text-gray-900" : "text-gray-400 line-through"}`}>
                          {item.insumo_nombre}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {item.codigo_insumo} · Esperado: {item.cantidad_esperada} {item.unidad_simbolo}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Cargando…</p>
          )}

          {esParcial && ocDetalle && (
            <p className="text-xs text-gray-500">
              {ocDetalle.items.filter((it) => !it.ya_recibido).filter((it) => marcados.has(it.id_detalle_orden)).length} de {ocDetalle.items.filter((it) => !it.ya_recibido).length} ítems faltantes por ingresar
            </p>
          )}
          {esEnProceso && detalle && (
            <p className="text-xs text-gray-500">
              {marcados.size} de {detalle.items?.length ?? 0} ítems por ingresar
            </p>
          )}
        </div>

        {esEnProceso && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
            <button onClick={cancelar} disabled={working} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40">
              Cancelar Recepción
            </button>
            <button
              onClick={ingresar}
              disabled={working}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#16A34A" }}
            >
              <Icons.CheckMark /> Ingresar
            </button>
          </div>
        )}
        {esParcial && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
              Cerrar
            </button>
            <button
              onClick={completar}
              disabled={working}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#16A34A" }}
            >
              <Icons.CheckMark /> Completar
            </button>
          </div>
        )}
        {esCompleta && (
          <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
