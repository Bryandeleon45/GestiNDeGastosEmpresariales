import { useState, useEffect } from "react"
import { G, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import type { SolProv } from "@/models/portalProveedor"

export default function NuevaProformaModal({
  sol,
  dark,
  onClose,
  onToast,
}: {
  sol: SolProv
  dark: boolean
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
  const [precio, setPrecio] = useState("")
  const [entrega, setEntrega] = useState("")
  const card = dark ? "#1E293B" : "#FFFFFF"
  const text = dark ? "#F8FAFC" : "#111827"
  const sub = dark ? "#94A3B8" : "#6B7280"
  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.6 : 0})`,
          backdropFilter: "blur(3px)",
          transition: "background-color 0.28s",
        }}
      />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto"
          style={{
            backgroundColor: card,
            animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)",
          }}
        >
          <div
            className="flex items-center gap-3 px-6 pt-6 pb-4 border-b"
            style={{ borderColor: dark ? "#334155" : "#F3F4F6" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: G }}
            >
              <Icons.Doc />
            </div>
            <div>
              <h2
                className="text-base font-bold leading-none"
                style={{ color: text }}
              >
                Nueva Proforma
              </h2>
              <p className="text-xs mt-0.5" style={{ color: sub }}>
                Solicitud {sol.num} · {sol.cat}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="ml-auto p-1.5 rounded-lg transition-all hover:opacity-70"
              style={{ color: sub }}
            >
              <Icons.X />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label
                className="text-xs font-bold block mb-1.5"
                style={{ color: sub }}
              >
                Precio Unitario Ofertado (Q)
              </label>
              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0.00"
                type="number"
                className="w-full px-3 py-2.5 text-sm border-2 rounded-xl focus:outline-none transition-colors"
                style={{
                  backgroundColor: dark ? "#0F172A" : "#F9FAFB",
                  borderColor: precio ? G : "#334155",
                  color: text,
                }}
              />
            </div>
            <div>
              <label
                className="text-xs font-bold block mb-1.5"
                style={{ color: sub }}
              >
                Tiempo de Entrega
              </label>
              <input
                value={entrega}
                onChange={(e) => setEntrega(e.target.value)}
                placeholder="Ej. 3 días hábiles"
                className="w-full px-3 py-2.5 text-sm border-2 rounded-xl focus:outline-none transition-colors"
                style={{
                  backgroundColor: dark ? "#0F172A" : "#F9FAFB",
                  borderColor: entrega ? G : "#334155",
                  color: text,
                }}
              />
            </div>
            <div
              className="rounded-xl px-4 py-3 text-xs leading-relaxed border"
              style={{
                backgroundColor: dark ? "rgba(30,94,47,0.15)" : "#F0FDF4",
                borderColor: dark ? "rgba(30,94,47,0.3)" : GB,
                color: dark ? "#86EFAC" : G,
              }}
            >
              Presupuesto estimado de la solicitud: <b>{sol.presupuesto}</b>
            </div>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl border transition-all"
              style={{ color: sub, borderColor: dark ? "#334155" : "#E5E7EB" }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (!precio || !entrega) return
                handleClose()
                setTimeout(
                  () =>
                    onToast(
                      "Proforma enviada",
                      "Tu cotización fue registrada para revisión técnica.",
                    ),
                  300,
                )
              }}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{
                backgroundColor: G,
                opacity: !precio || !entrega ? 0.5 : 1,
              }}
            >
              Enviar Cotización
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
