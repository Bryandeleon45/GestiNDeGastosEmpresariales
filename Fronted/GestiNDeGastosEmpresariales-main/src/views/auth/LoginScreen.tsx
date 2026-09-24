import { useState } from "react"
import { G } from "@/constants/theme"
import MunicipalSeal from "@/components/common/MunicipalSeal"
import { LAKE_IMG, LOGIN_STATS } from "@/models/login"
import ForgotPasswordModal from "@/views/auth/ForgotPasswordModal"

export default function LoginScreen({
  onLogin,
}: {
  onLogin: (pw: string) => void
}) {
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [focusField, setFocusField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = () => {
    setError("")
    if (!usuario || !password) {
      setError("Por favor complete todos los campos.")
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin(password)
    }, 900)
  }

  const fieldStyle = (name: string) => ({
    borderColor: focusField === name ? G : "#E2E8F0",
    boxShadow:
      focusField === name ? `0 0 0 3px rgba(30,94,47,0.08)` : undefined,
    transition: "border-color 0.2s, box-shadow 0.2s",
  })

  return (
    <div className="min-h-screen flex" style={{ background: "#F8F9FA" }}>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col">
        <img
          src={LAKE_IMG}
          alt="Lago de Atitlán"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.25) 40%, rgba(15,23,42,0.75) 100%)",
          }}
        />
        <div className="relative flex flex-col h-full px-10 py-10 text-white">
          <div className="flex items-center gap-3">
            <MunicipalSeal size={48} />
            <div>
              <p className="text-sm font-extrabold leading-none">
                Municipalidad de Panajachel
              </p>
              <p className="text-[11px] text-white/60 mt-0.5">
                Sololá, Guatemala
              </p>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 w-fit"
              style={{
                backgroundColor: "rgba(34,197,94,0.2)",
                border: "1px solid rgba(34,197,94,0.35)",
                color: "#86EFAC",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sistema Activo · Versión 2.4.1
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
              Sistema de Gestión Municipal y Cadena de Suministros
            </h1>
            <p className="mt-4 text-base text-white/70 leading-relaxed">
              Plataforma digital centralizada para la administración de
              inventario, proveedores y finanzas públicas.
            </p>
            <div className="flex gap-6 mt-10">
              {LOGIN_STATS.map((s) => (
                <div key={s.label}>
                  <p
                    className="text-2xl font-extrabold"
                    style={{ color: "#86EFAC" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-xs text-white/55 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/55 text-xs">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Panajachel, Sololá · Guatemala
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <MunicipalSeal size={40} />
            <div>
              <p className="text-sm font-extrabold text-gray-900 leading-none">
                Municipalidad de Panajachel
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Gestión Municipal · Sololá
              </p>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-5">
              <MunicipalSeal size={56} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Ingrese sus credenciales administrativas para acceder al sistema.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">
                Usuario / Correo
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  onFocus={() => setFocusField("usuario")}
                  onBlur={() => setFocusField(null)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="ejemplo@munipanajachel.gob.gt"
                  className="w-full pl-10 pr-4 py-3 text-sm border-2 rounded-xl bg-white focus:outline-none"
                  style={fieldStyle("usuario")}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField("password")}
                  onBlur={() => setFocusField(null)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 text-sm border-2 rounded-xl bg-white focus:outline-none"
                  style={fieldStyle("password")}
                />
                <button
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPass ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <button
                  onClick={() => setRemember((v) => !v)}
                  className="w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all shrink-0"
                  style={{
                    width: 18,
                    height: 18,
                    borderColor: remember ? G : "#CBD5E1",
                    backgroundColor: remember ? G : "white",
                  }}
                >
                  {remember && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span className="text-xs font-semibold text-gray-600">
                  Recordar usuario
                </span>
              </label>
              <button
                onClick={() => setShowForgot(true)}
                className="text-xs font-semibold transition-all hover:underline"
                style={{ color: G }}
              >
                ¿Olvidó su contraseña?
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 border border-red-100">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-extrabold text-white rounded-xl transition-all shadow-md mt-2 active:scale-[.98]"
              style={{
                backgroundColor: G,
                opacity: loading ? 0.8 : 1,
                boxShadow: `0 4px 14px rgba(30,94,47,0.35)`,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "#164A24"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = G
              }}
            >
              {loading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Verificando…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Ingresar al Sistema
                </>
              )}
            </button>
          </div>

          <div className="flex items-start gap-2 mt-6 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
            <svg
              className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Acceso restringido únicamente a personal autorizado por la
              Municipalidad de Panajachel.
            </p>
          </div>

          <p className="text-center text-[11px] text-gray-300 mt-6">
            © 2023 Municipalidad de Panajachel · v2.4.1
          </p>
        </div>
      </div>

      {showForgot && (
        <ForgotPasswordModal onClose={() => setShowForgot(false)} />
      )}
    </div>
  )
}
