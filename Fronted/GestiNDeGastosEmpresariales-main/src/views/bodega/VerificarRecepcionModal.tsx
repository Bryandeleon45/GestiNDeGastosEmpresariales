import { useEffect, useState } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  obtenerRecepcion,
  verificarItemRecepcion,
  finalizarRecepcion,
  cancelarRecepcion,
  type Recepcion,
  type RecepcionItem,
} from "@/api/bodega"
import { ApiError } from "@/api/client"

const ESTADO_ITEM_BG: Record<string, string> = {
  Recibido: "#F0FDF4",
  Rechazado: "#FFF5F5",
  Faltante: "#FFFBEB",
  Pendiente: "transparent",
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
  const [detalle, setDetalle] = useState<Recepcion | null>(null)
  const [obs, setObs] = useState<Record<number, string>>({})
  const [obsOpen, setObsOpen] = useState<number | null>(null)
  const [working, setWorking] = useState(false)

  const cargar = async () => {
    try {
      setDetalle(await obtenerRecepcion(recepcion.id_recepcion))
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cargar la recepción")
    }
  }

  useEffect(() => {
    cargar()
  }, [recepcion.id_recepcion])

  const verificar = async (item: RecepcionItem, estado: string) => {
    setWorking(true)
    try {
      await verificarItemRecepcion(recepcion.id_recepcion, item.id_detalle_recepcion, {
        estado_item: estado,
        cantidad_aceptada: estado === "Recibido" ? item.cantidad_esperada : 0,
        observacion: obs[item.id_detalle_recepcion] || undefined,
      })
      setObsOpen(null)
      await cargar()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo verificar el ítem")
    } finally {
      setWorking(false)
    }
  }

  const finalizar = async () => {
    const pendientes = (detalle?.items ?? []).filter((i) => i.estado_item === "Pendiente")
    if (pendientes.length > 0) {
      onToast("Verifica todos los ítems", "Marca cada ítem como Recibido, Rechazado o Faltante.")
      return
    }
    if (!window.confirm("¿Finalizar y cargar a inventario? Solo las cantidades aceptadas generarán Entrada en el Kardex.")) return
    setWorking(true)
    try {
      const res = await finalizarRecepcion(recepcion.id_recepcion)
      onToast("Recepción finalizada", `Estado: ${res.estado}. ${res.total_aceptado} unidades cargadas.`)
      onChanged()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo finalizar")
    } finally {
      setWorking(false)
    }
  }

  const cancelar = async () => {
    if (!window.confirm("¿Cancelar esta recepción?")) return
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

  const items = detalle?.items ?? []

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
              <h2 className="text-lg font-bold text-gray-900">Verificación de ítems</h2>
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
          {items.map((item) => {
            const estado = item.estado_item
            return (
              <div
                key={item.id_detalle_recepcion}
                className="border border-gray-200 rounded-lg p-4 transition-colors"
                style={{ backgroundColor: ESTADO_ITEM_BG[estado] ?? "transparent" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-snug">{item.insumo_nombre}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {item.codigo_insumo} · Esperado: {item.cantidad_esperada} {item.unidad_simbolo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  <button
                    onClick={() => verificar(item, "Recibido")}
                    disabled={working}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50"
                    style={estado === "Recibido" ? { backgroundColor: G, color: "white" } : { backgroundColor: "white", color: G, border: `1.5px solid ${G}` }}
                  >
                    <Icons.CheckMark /> Recibido
                  </button>
                  <button
                    onClick={() => { setObsOpen(item.id_detalle_recepcion); setObs((p) => ({ ...p, [item.id_detalle_recepcion]: p[item.id_detalle_recepcion] ?? "" })) }}
                    disabled={working}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50"
                    style={estado === "Rechazado" ? { backgroundColor: "#DC2626", color: "white" } : { backgroundColor: "white", color: "#DC2626", border: "1.5px solid #DC2626" }}
                  >
                    <Icons.X /> Rechazar
                  </button>
                  <button
                    onClick={() => { setObsOpen(item.id_detalle_recepcion); setObs((p) => ({ ...p, [item.id_detalle_recepcion]: p[item.id_detalle_recepcion] ?? "" })) }}
                    disabled={working}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50"
                    style={estado === "Faltante" ? { backgroundColor: "#D97706", color: "white" } : { backgroundColor: "white", color: "#6B7280", border: "1.5px solid #D1D5DB" }}
                  >
                    <Icons.Info /> Faltante
                  </button>
                </div>
                {obsOpen === item.id_detalle_recepcion && (
                  <div className="flex gap-2 mt-3">
                    <input
                      value={obs[item.id_detalle_recepcion] ?? ""}
                      onChange={(e) => setObs((p) => ({ ...p, [item.id_detalle_recepcion]: e.target.value }))}
                      placeholder="Observación (obligatoria para Rechazado/Faltante)…"
                      className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-400"
                    />
                    <button
                      onClick={() => { const e = obs[item.id_detalle_recepcion]?.trim(); if (!e) { onToast("Revisar formulario", "La observación es obligatoria"); return } verificar(item, item.estado_item === "Faltante" ? "Faltante" : "Rechazado") }}
                      disabled={working}
                      className="px-3 py-2 text-xs font-bold text-white rounded-lg disabled:opacity-50"
                      style={{ backgroundColor: "#DC2626" }}
                    >
                      Confirmar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={cancelar} disabled={working} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40">
            Cancelar Recepción
          </button>
          <button
            onClick={finalizar}
            disabled={working}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: G }}
          >
            <Icons.CheckCircle /> Finalizar y Cargar a Inventario
          </button>
        </div>
      </div>
    </div>
  )
}
