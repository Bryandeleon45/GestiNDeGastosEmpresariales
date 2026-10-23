import { useState, useEffect } from "react"
import { recuperarContrasena, restablecerContrasena } from "@/api/auth"

const WA = "#25D366"
const WAL = "#E8F8EF"

type Paso = "telefono" | "codigo" | "listo"

export default function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false)
  const [paso, setPaso] = useState<Paso>("telefono")
  const [telefono, setTelefono] = useState("")
  const [codigo, setCodigo] = useState("")
  const [clave, setClave] = useState("")
  const [clave2, setClave2] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [devCodigo, setDevCodigo] = useState("")
  const [cooldown, setCooldown] = useState(0)
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

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const fieldStyle = (name: string) => ({
    borderColor: focusField === name ? WA : "#E2E8F0",
    boxShadow: focusField === name ? "0 0 0 3px rgba(37,211,102,0.12)" : undefined,
    transition: "border-color 0.2s, box-shadow 0.2s",
  })

  const enviarCodigo = async (esReenvio = false) => {
    setError("")
    const digitos = telefono.replace(/\D/g, "")
    if (digitos.length !== 8) {
      setError("Ingrese su número de WhatsApp de 8 dígitos.")
      return
    }
    setLoading(true)
    try {
      const res = await recuperarContrasena(digitos)
      setDevCodigo(res?.dev_codigo ?? "")
      setPaso("codigo")
      setCooldown(60)
      if (esReenvio) setCodigo("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el código.")
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
          {paso === "telefono" && (
            <>
              <div className="px-8 pt-8 pb-2 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: WAL }}
                >
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke={WA}
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Recuperar Contraseña
                </h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Ingrese su número de WhatsApp y le enviaremos un mensaje con
                  el código de verificación para restablecer su acceso.
                </p>
              </div>
              <div className="px-8 py-5">
                <label className="text-xs font-bold text-gray-600 block mb-1.5">
                  Número de WhatsApp
                </label>
                <div
                  className="flex items-center border border-gray-200 rounded-xl overflow-hidden"
                  style={fieldStyle("telefono")}
                >
                  <span className="px-3 py-3 text-sm font-semibold text-gray-500 bg-gray-50 border-r border-gray-200 shrink-0">
                    +502
                  </span>
                  <input
                    value={telefono}
                    onChange={(e) =>
                      setTelefono(e.target.value.replace(/\D/g, "").slice(0, 8))
                    }
                    onFocus={() => setFocusField("telefono")}
                    onBlur={() => setFocusField(null)}
                    inputMode="numeric"
                    placeholder="55512345"
                    className="w-full px-4 py-3 text-sm border-0 focus:outline-none"
                  />
                </div>
                {error && (
                  <p className="text-xs font-semibold text-red-500 mt-2">{error}</p>
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
                  onClick={() => enviarCodigo(false)}
                  disabled={loading || telefono.replace(/\D/g, "").length !== 8}
                  className="flex-1 py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
                  style={{ backgroundColor: WA }}
                >
                  {loading ? "Enviando…" : "Enviar Mensaje"}
                </button>
              </div>
            </>
          )}

          {paso === "codigo" && (
            <>
              <div className="px-8 pt-8 pb-2 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: WAL }}
                >
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke={WA}
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16v16H4z" />
                    <path d="M8 10h8M8 14h5" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Ingrese el Código
                </h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Enviamos un mensaje con el código de 6 dígitos a{" "}
                  <b className="text-gray-700">+502 {telefono}</b>. Vence en 30
                  minutos.
                </p>
              </div>
              <div className="px-8 py-5 space-y-4">
                {devCodigo && (
                  <div
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold border"
                    style={{ backgroundColor: WAL, borderColor: WA, color: "#128C4A" }}
                  >
                    Modo desarrollo — código: <b>{devCodigo}</b>
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
                  <p className="text-xs font-semibold text-red-500">{error}</p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setPaso("telefono")
                      setError("")
                    }}
                    className="font-semibold text-gray-500 hover:text-gray-700"
                  >
                    ← Cambiar número
                  </button>
                  <button
                    onClick={() => enviarCodigo(true)}
                    disabled={cooldown > 0 || loading}
                    className="font-bold disabled:opacity-50"
                    style={{ color: WA }}
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
                  style={{ backgroundColor: WA }}
                >
                  {loading ? "Restableciendo…" : "Restablecer"}
                </button>
              </div>
            </>
          )}

          {paso === "listo" && (
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
                Ya puede iniciar sesión con su nueva contraseña.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                style={{ backgroundColor: WA }}
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
