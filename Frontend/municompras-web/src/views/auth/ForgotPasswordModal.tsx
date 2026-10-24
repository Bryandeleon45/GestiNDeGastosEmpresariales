import { useState, useEffect } from "react"
import { recuperarContrasena } from "@/api/auth"
import { G, GL, BRAND_HEX } from "@/constants/theme"

const FOCO = "0 0 0 3px rgba(30,94,47,0.12)"

export default function ForgotPasswordModal({
  onClose,
  onSent,
}: {
  onClose: () => void
  onSent: (correo: string, devCodigo: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const [correo, setCorreo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [focusField, setFocusField] = useState<string | null>(null)

  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const fieldStyle = (name: string) => ({
    borderColor: focusField === name ? G : "#E2E8F0",
    boxShadow: focusField === name ? FOCO : undefined,
    transition: "border-color 0.2s, box-shadow 0.2s",
  })

  const enviarCodigo = async () => {
    setError("")
    if (!correoValido) {
      setError("Ingrese un correo electrónico válido.")
      return
    }
    setLoading(true)
    try {
      const res = await recuperarContrasena(correo.trim())
      setVisible(false)
      setTimeout(() => onSent(correo.trim(), res?.dev_codigo ?? ""), 280)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el código.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.55 : 0})`,
          backdropFilter: "blur(4px)",
          transition: "background-color 0.28s",
        }}
      />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto"
          style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
        >
          <div className="px-8 pt-8 pb-2 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: GL }}
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke={BRAND_HEX}
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">
              Recuperar Contraseña
            </h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Ingrese su correo electrónico y le enviaremos un código de
              verificación para restablecer su acceso.
            </p>
          </div>
          <div className="px-8 py-5">
            <label className="text-xs font-bold text-gray-600 block mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              onFocus={() => setFocusField("correo")}
              onBlur={() => setFocusField(null)}
              inputMode="email"
              autoComplete="email"
              autoFocus
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none"
              style={fieldStyle("correo")}
            />
            {error && (
              <p className="text-xs font-semibold text-red-500 mt-2" aria-live="polite">
                {error}
              </p>
            )}
          </div>
          <div className="flex gap-3 px-8 pb-8">
            <button
              onClick={handleClose}
              className="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={enviarCodigo}
              disabled={loading || !correoValido}
              className="flex-1 py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
              style={{ backgroundColor: G }}
            >
              {loading ? "Enviando…" : "Enviar código"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
