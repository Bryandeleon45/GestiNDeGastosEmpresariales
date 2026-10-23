import { useState, useEffect } from "react"
import { restablecerContrasena } from "@/api/auth"
import { G, GL, BRAND_HEX } from "@/constants/theme"

const FOCO = "0 0 0 3px rgba(30,94,47,0.12)"

export default function NewPasswordModal({
  correo,
  codigo,
  onBack,
  onClose,
}: {
  correo: string
  codigo: string
  onBack: () => void
  onClose: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [paso, setPaso] = useState<"clave" | "listo">("clave")
  const [clave, setClave] = useState("")
  const [clave2, setClave2] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [focusField, setFocusField] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (paso !== "listo") return
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 280)
    }, 1600)
    return () => clearTimeout(t)
  }, [paso, onClose])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const fieldStyle = (name: string) => ({
    borderColor: focusField === name ? G : "#E2E8F0",
    boxShadow: focusField === name ? FOCO : undefined,
    transition: "border-color 0.2s, box-shadow 0.2s",
  })

  const restablecer = async () => {
    setError("")
    if (clave.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres.")
      return
    }
    if (clave !== clave2) {
      setError("Las contraseñas no coinciden.")
      return
    }
    setLoading(true)
    try {
      await restablecerContrasena(codigo, clave)
      setPaso("listo")
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo restablecer la contraseña.",
      )
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
          {paso === "clave" ? (
            <>
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
                    <circle cx="7.5" cy="15.5" r="4.5" />
                    <path d="M10.7 12.3 21 2M16 7l3 3M19 4l2 2" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Nueva Contraseña
                </h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Cree una nueva contraseña para{" "}
                  <b className="text-gray-700">{correo}</b>. Debe tener al menos 8
                  caracteres.
                </p>
              </div>
              <div className="px-8 py-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    onFocus={() => setFocusField("clave")}
                    onBlur={() => setFocusField(null)}
                    autoFocus
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none"
                    style={fieldStyle("clave")}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    value={clave2}
                    onChange={(e) => setClave2(e.target.value)}
                    onFocus={() => setFocusField("clave2")}
                    onBlur={() => setFocusField(null)}
                    placeholder="Repita la contraseña"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none"
                    style={fieldStyle("clave2")}
                  />
                </div>
                {error && (
                  <p
                    className="text-xs font-semibold text-red-500"
                    aria-live="polite"
                  >
                    {error}
                  </p>
                )}
                <div className="text-xs">
                  <button
                    onClick={() => {
                      setVisible(false)
                      setTimeout(onBack, 280)
                    }}
                    className="font-semibold text-gray-500 hover:text-gray-700"
                  >
                    ← Cambiar código
                  </button>
                </div>
              </div>
              <div className="flex gap-3 px-8 pb-8">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={restablecer}
                  disabled={loading}
                  className="flex-1 py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
                  style={{ backgroundColor: G }}
                >
                  {loading ? "Restableciendo…" : "Restablecer contraseña"}
                </button>
              </div>
            </>
          ) : (
            <div className="px-8 py-10 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-emerald-50">
                <svg
                  className="w-7 h-7 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Contraseña restablecida
              </h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Ya puede iniciar sesión con su nueva contraseña. Redirigiendo al
                inicio de sesión…
              </p>
              <button
                onClick={handleClose}
                className="mt-6 w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                style={{ backgroundColor: G }}
              >
                Ir a iniciar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
