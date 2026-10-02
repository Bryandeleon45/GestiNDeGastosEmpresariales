import { useState, useEffect } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { cambiarClave } from "@/api/auth"

export default function CambiarClaveModal({
  onComplete,
}: {
  onComplete: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const [claveActual, setClaveActual] = useState("")
  const [claveNueva, setClaveNueva] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")
    if (!claveActual.trim()) {
      setError("Ingresa tu contraseña actual")
      return
    }
    if (claveNueva.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres")
      return
    }
    if (claveNueva !== confirmar) {
      setError("Las contraseñas no coinciden")
      return
    }
    setLoading(true)
    try {
      await cambiarClave(claveActual, claveNueva)
      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar la contraseña")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[300]"
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`,
          backdropFilter: "blur(3px)",
          transition: "background-color 0.28s",
        }}
      />
      <div className="fixed inset-0 z-[310] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          style={{
            animation: visible
              ? "modalIn 0.22s cubic-bezier(.16,1,.3,1)"
              : undefined,
          }}
        >
          <div className="px-7 py-6 text-center space-y-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ backgroundColor: GL, color: G }}
            >
              <Icons.Key />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">
              Cambio de Contraseña Requerido
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Por seguridad, debes cambiar tu contraseña temporal antes de
              continuar. Ingresa tu contraseña actual y define una nueva.
            </p>
          </div>

          <div className="px-7 pb-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">
                Contraseña actual
              </label>
              <input
                type="password"
                value={claveActual}
                onChange={(e) => setClaveActual(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2"
                style={{ borderColor: "var(--muni-border)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={claveNueva}
                  onChange={(e) => setClaveNueva(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-3 pr-12 rounded-xl border text-sm outline-none transition-all focus:ring-2"
                  style={{ borderColor: "var(--muni-border)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">
                Confirmar nueva contraseña
              </label>
              <input
                type={showPass ? "text" : "password"}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2"
                style={{ borderColor: "var(--muni-border)" }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 border border-red-100">
                <Icons.Warning />
                {error}
              </div>
            )}
          </div>

          <div className="px-7 py-5 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-60"
              style={{ backgroundColor: G }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Cambiando…
                </>
              ) : (
                <>
                  <Icons.CheckMark /> Cambiar contraseña
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
