import { useState, useEffect } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { DEPTO_ESTADO_STYLE, type DeptoEstado } from "@/models/reportes"

export default function FiltrarReportesModal({
  onClose,
  onApply,
}: {
  onClose: () => void
  onApply: (estado: DeptoEstado | "Todos") => void
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
  const [sel, setSel] = useState<DeptoEstado | "Todos">("Todos")
  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.35 : 0})`,
          backdropFilter: "blur(1px)",
          transition: "background-color 0.25s",
        }}
      />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto"
          style={{ animation: "modalIn 0.2s cubic-bezier(.16,1,.3,1)" }}
        >
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: G }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-none">
                Filtrar Departamentos
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Filtrar por estado presupuestario
              </p>
            </div>
            <button
              onClick={handleClose}
              className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Icons.X />
            </button>
          </div>
          <div className="px-6 py-5 space-y-2">
            {([
              "Todos",
              "Dentro de Límite",
              "Excedido",
              "En Proceso",
            ] as const).map((opt) => {
              const active = sel === opt
              const s = opt !== "Todos" ? DEPTO_ESTADO_STYLE[opt] : null
              return (
                <button
                  key={opt}
                  onClick={() => setSel(opt)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold"
                  style={
                    active
                      ? { borderColor: G, backgroundColor: GL, color: G }
                      : {
                          borderColor: "#E5E7EB",
                          backgroundColor: "white",
                          color: "#374151",
                        }
                  }
                >
                  <span>{opt === "Todos" ? "Todos los estados" : opt}</span>
                  {s && (
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: s.bg, color: s.color }}
                    >
                      {opt}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onApply(sel)
                handleClose()
              }}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: G }}
            >
              Aplicar Filtro
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
