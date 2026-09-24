import { useState, useEffect } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { COMP_ITEMS, COMP_PROVS } from "@/models/proformas"

export default function ConfirmarAdjudicacionModal({
  winner,
  onClose,
  onConfirm,
}: {
  winner: string
  onClose: () => void
  onConfirm: () => void
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
  const prov = COMP_PROVS.find((p) => p.id === winner)!
  const total = prov.items.reduce((s, i) => s + i.total, 0)
  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.55 : 0})`,
          backdropFilter: "blur(2px)",
          transition: "background-color 0.28s",
        }}
      />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto"
          style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
        >
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: G }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-none">
                Confirmar Adjudicación
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Compra #SOL-2023-084
              </p>
            </div>
            <button
              onClick={handleClose}
              className="ml-auto p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Icons.X />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div
              className="rounded-xl border p-4 flex items-start gap-4"
              style={{ backgroundColor: GL, borderColor: GB }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: G }}
              >
                <Icons.Dependencias />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{prov.name}</p>
                <p className="text-xs text-gray-500">
                  {prov.provId} · ★ {prov.rating}
                </p>
                <p className="text-lg font-extrabold mt-1" style={{ color: G }}>
                  Q{" "}
                  {total.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {COMP_ITEMS.map((item, i) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
                >
                  <span className="text-gray-700 font-medium">
                    {item.label}
                  </span>
                  <span className="font-bold font-mono text-gray-900">
                    Q{" "}
                    {prov.items[i].total.toLocaleString("es-GT", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed rounded-lg px-3 py-2.5 bg-amber-50 border border-amber-100">
              <svg
                className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Esta acción generará una Orden de Compra oficial y notificará al
              proveedor y a DAFIM.
            </div>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm()
                handleClose()
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: G }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Adjudicar y Generar Orden de Compra
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
