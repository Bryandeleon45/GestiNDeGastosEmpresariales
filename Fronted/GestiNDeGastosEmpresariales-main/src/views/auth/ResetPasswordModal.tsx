import { useState, useEffect } from "react"
import { recuperarContrasena, restablecerContrasena } from "@/api/auth"
import { G, GL, GB, BRAND_HEX } from "@/constants/theme"

const FOCO = "0 0 0 3px rgba(30,94,47,0.12)"

export default function ResetPasswordModal({
  correo,
  devCodigo,
  onBack,
  onClose,
}: {
  correo: string
  devCodigo: string
  onBack: () => void
  onClose: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [paso, setPaso] = useState<"codigo" | "listo">("codigo")
  const [codigo, setCodigo] = useState("")
  const [clave, setClave] = useState("")
  const [clave2, setClave2] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [devActual, setDevActual] = useState(devCodigo)
  const [cooldown, setCooldown] = useState(60)
  const [focusField, setFocusField] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

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

  const reenviar = async () => {
    setError("")
    setLoading(true)
    try {
      const res = await recuperarContrasena(correo)
      setDevActual(res?.dev_codigo ?? "")
      setCodigo("")
      setCooldown(60)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo reenviar el código.")
    } finally {
      setLoading(false)
    }
  }

  const restablecer = async () => {
    setError("")
    if (codigo.trim().length !== 6) {
      setError("El código debe tener 6 dígitos.")
      return
    }
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
      await restablecerContrasena(codigo.trim(), clave)
      setPaso("listo")
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo restablecer la contraseña.")
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
          {paso === "codigo" ? (
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
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Ingrese el Código
                </h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Enviamos un código de 6 dígitos a{" "}
                  <b className="text-gray-700">{correo}</b>. Vence en 30
                  minutos.
                </p>
              </div>
              <div className="px-8 py-5 space-y-4">
                {devActual && (
                  <div
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold border"
                    style={{ backgroundColor: GL, borderColor: GB, color: G }}
                  >
                    Modo desarrollo — código: <b>{devActual}</b>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">
                    Código de verificación
                  </label>
                  <input
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onFocus={() => setFocusField("codigo")}
                    onBlur={() => setFocusField(null)}
                    inputMode="numeric"
                    autoFocus
                    placeholder="000000"
                    className="w-full px-4 py-3 text-center text-lg tracking-[0.5em] font-mono border border-gray-200 rounded-xl focus:outline-none"
                    style={fieldStyle("codigo")}
                  />
                </div>
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
                  <p className="text-xs font-semibold text-red-500" aria-live="polite">
                    {error}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setVisible(false)
                      setTimeout(onBack, 280)
                    }}
                    className="font-semibold text-gray-500 hover:text-gray-700"
                  >
                    ← Cambiar correo
                  </button>
                  <button
                    onClick={reenviar}
                    disabled={cooldown > 0 || loading}
                    className="font-bold disabled:opacity-50"
                    style={{ color: G }}
                  >
                    {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar código"}
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
                  {loading ? "Restableciendo…" : "Restablecer"}
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
