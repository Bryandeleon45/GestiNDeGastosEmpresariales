import { useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  autorizarValeSalida,
  entregarValeSalida,
  cancelarValeSalida,
  type ValeSalidaDetalle,
} from "@/api/bodega"
import { ApiError } from "@/api/client"

const ESTADO_VALE_STYLE: Record<string, { bg: string; color: string }> = {
  Pendiente: { bg: "var(--gray-100)", color: "#64748B" },
  Autorizado: { bg: "#FEF9C3", color: "#854D0E" },
  Entregado: { bg: "#DCFCE7", color: "#16A34A" },
  Cancelado: { bg: "#FEE2E2", color: "#DC2626" },
}

function fmtFecha(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function DetalleValeModal({
  vale,
  onClose,
  onChanged,
  onToast,
}: {
  vale: ValeSalidaDetalle
  onClose: () => void
  onChanged: () => void
  onToast: (m: string, s: string) => void
}) {
  const [acting, setActing] = useState<"autorizar" | "entregar" | "cancelar" | "">("")

  const est = ESTADO_VALE_STYLE[vale.estado] ?? { bg: "var(--gray-100)", color: "#64748B" }

  const ejecutar = async (accion: "autorizar" | "entregar" | "cancelar") => {
    setActing(accion)
    try {
      if (accion === "autorizar") {
        await autorizarValeSalida(vale.id_vale_salida)
        onToast("Vale autorizado", "El vale quedó listo para entrega.")
      } else if (accion === "entregar") {
        await entregarValeSalida(vale.id_vale_salida)
        onToast("Vale entregado", "Stock actualizado y Kardex registrado.")
      } else {
        await cancelarValeSalida(vale.id_vale_salida)
        onToast("Vale cancelado", "El vale fue cancelado.")
      }
      onChanged()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo actualizar el vale")
      setActing("")
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
              <Icons.Doc />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Vale S-2026-{vale.id_vale_salida}</h2>
              <p className="text-xs text-gray-500">Detalle del vale de salida</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
            <Icons.X />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estado</label>
              <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: est.bg, color: est.color }}>
                {vale.estado}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fecha de salida</label>
              <p className="text-sm text-gray-800 font-mono">{fmtFecha(vale.fecha_salida)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dependencia</label>
              <p className="text-sm font-medium text-gray-800">{vale.nombre_dependencia || "—"}</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Solicitante</label>
              <p className="text-sm text-gray-800">{vale.nombre_solicitante || "—"}</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Autorizado por</label>
              <p className="text-sm text-gray-800">{vale.nombre_autoriza || "—"}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Justificación</label>
            <div className="px-3 py-2.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
              {vale.justificacion || "Sin justificación registrada."}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Insumos a entregar ({vale.items.length})
            </label>
            {vale.items.length === 0 ? (
              <div className="px-3 py-4 text-sm text-center text-gray-400 bg-gray-50 border border-gray-200 rounded-lg">
                Este vale no tiene insumos registrados.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-50">
                {vale.items.map((it) => (
                  <div key={it.id_detalle_vale} className="flex items-center justify-between gap-3 px-4 py-3" style={{ backgroundColor: GL }}>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{it.descripcion || "Insumo"}</p>
                      {it.observacion && <p className="text-xs text-gray-500 truncate">{it.observacion}</p>}
                    </div>
                    <p className="text-sm font-bold whitespace-nowrap" style={{ color: G }}>{it.cantidad_salida}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-400">
            {vale.estado === "Pendiente" && "Acciones: autorizar o cancelar el vale."}
            {vale.estado === "Autorizado" && "Acción: entregar el vale."}
            {(vale.estado === "Entregado" || vale.estado === "Cancelado") && "Sin acciones disponibles."}
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
              Cerrar
            </button>
            {vale.estado === "Pendiente" && (
              <>
                <button
                  onClick={() => ejecutar("cancelar")}
                  disabled={acting !== ""}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-red-600 border border-red-200 rounded-lg transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <Icons.X /> Cancelar
                </button>
                <button
                  onClick={() => ejecutar("autorizar")}
                  disabled={acting !== ""}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-colors hover:opacity-80 shadow-sm disabled:opacity-50"
                  style={{ backgroundColor: G }}
                >
                  <Icons.ShieldCheck /> {acting === "autorizar" ? "Autorizando…" : "Autorizar"}
                </button>
              </>
            )}
            {vale.estado === "Autorizado" && (
              <button
                onClick={() => ejecutar("entregar")}
                disabled={acting !== ""}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-colors hover:opacity-80 shadow-sm disabled:opacity-50"
                style={{ backgroundColor: G }}
              >
                <Icons.Send /> {acting === "entregar" ? "Entregando…" : "Entregar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
