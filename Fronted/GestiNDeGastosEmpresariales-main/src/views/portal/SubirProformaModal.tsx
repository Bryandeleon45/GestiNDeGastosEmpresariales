import { useState, useEffect } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"

export default function SubirProformaModal({
  dark,
  onClose,
  onToast,
}: {
  dark: boolean
  onClose: () => void
  onToast: (m: string, s: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<string | null>(null)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])
  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }
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
              <Icons.PDF />
            </div>
            <div>
              <h2
                className="text-base font-bold leading-none"
                style={{ color: text }}
              >
                Subir Proforma Directa
              </h2>
              <p className="text-xs mt-0.5" style={{ color: sub }}>
                Adjunte su documento de proforma o cotización
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
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                setFile("proforma_documento.pdf")
              }}
              onClick={() => setFile("proforma_documento.pdf")}
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 gap-3 cursor-pointer transition-all"
              style={{
                borderColor:
                  dragging || file ? G : dark ? "#334155" : "#D1D5DB",
                backgroundColor: dragging
                  ? dark
                    ? "rgba(30,94,47,0.15)"
                    : "#F0FDF4"
                  : dark
                    ? "#0F172A"
                    : "#F9FAFB",
              }}
            >
              {file ? (
                <>
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke={G}
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <p className="text-sm font-bold" style={{ color: G }}>
                    {file}
                  </p>
                  <p className="text-xs" style={{ color: sub }}>
                    Haga clic para cambiar el archivo
                  </p>
                </>
              ) : (
                <>
                  <svg
                    className="w-10 h-10 opacity-40"
                    fill="none"
                    stroke={dark ? "#94A3B8" : "#9CA3AF"}
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <polyline points="16 16 12 12 8 16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                  </svg>
                  <p className="text-sm font-semibold" style={{ color: sub }}>
                    Arrastre o haga clic para adjuntar
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: dark ? "#475569" : "#9CA3AF" }}
                  >
                    PDF · XML · hasta 10 MB
                  </p>
                </>
              )}
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
                if (!file) return
                handleClose()
                setTimeout(
                  () =>
                    onToast(
                      "Proforma subida",
                      "Tu documento fue enviado para revisión técnica.",
                    ),
                  300,
                )
              }}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: G, opacity: !file ? 0.5 : 1 }}
            >
              Enviar Proforma
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
