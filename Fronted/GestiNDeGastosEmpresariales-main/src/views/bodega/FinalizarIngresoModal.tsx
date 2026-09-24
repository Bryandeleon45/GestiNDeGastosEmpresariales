import { useState, useEffect } from "react"
import { G } from "@/constants/theme"
import { OC_ITEMS, type VerifState } from "@/models/bodega"

export default function FinalizarIngresoModal({
  states,
  onClose,
  onToast,
}: {
  states: Record<string, VerifState>
  onClose: () => void
  onToast: (m: string, s: string) => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])
  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }
  const recibidos = OC_ITEMS.filter((i) => states[i.id] === "RECIBIDO").length
  const rechazados = OC_ITEMS.filter((i) => states[i.id] === "RECHAZADO").length
  const faltantes = OC_ITEMS.filter((i) => states[i.id] === "FALTANTE").length
  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`,
          backdropFilter: "blur(2px)",
          transition: "background-color 0.28s",
        }}
      />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto text-center"
          style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
        >
          <div className="px-6 pt-8 pb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4"
              style={{ backgroundColor: G }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Ingreso a Inventario Confirmado
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              OC-2023-045 · Papelería del Lago S.A.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: "Recibidos", value: recibidos, color: G },
                { label: "Rechazados", value: rechazados, color: "#DC2626" },
                { label: "Faltantes", value: faltantes, color: "#D97706" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-gray-100 bg-gray-50 py-3"
                >
                  <p
                    className="text-2xl font-extrabold font-mono"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              El stock del inventario ha sido actualizado. Se generó el acta de
              recepción <b>REC-2023-045</b>.
            </p>
          </div>
          <div className="px-6 pb-6">
            <button
              onClick={() => {
                handleClose()
                setTimeout(
                  () =>
                    onToast(
                      "Inventario actualizado",
                      "Acta REC-2023-045 generada y archivada.",
                    ),
                  300,
                )
              }}
              className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: G }}
            >
              Aceptar y Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
