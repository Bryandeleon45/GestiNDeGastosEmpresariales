import { useState, useEffect } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import type { UsuarioRecord } from "@/models/usuarios"

export default function ResetClaveModal({
  usuario,
  onClose,
  onReset,
}: {
  usuario: UsuarioRecord
  onClose: () => void
  onReset: () => Promise<string | null>
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const [loading, setLoading] = useState(false)
  const [claveTemp, setClaveTemp] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const handleReset = async () => {
    setLoading(true)
    setError("")
    try {
      const clave = await onReset()
      if (clave) setClaveTemp(clave)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo restablecer")
    } finally {
      setLoading(false)
    }
  }

  const copyClave = async () => {
    if (!claveTemp) return
    try {
      await navigator.clipboard.writeText(claveTemp)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // portapapeles no disponible
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`,
          backdropFilter: "blur(3px)",
          transition: "background-color 0.28s",
        }}
      />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
          style={{
            animation: visible
              ? "modalIn 0.22s cubic-bezier(.16,1,.3,1)"
              : undefined,
          }}
        >
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: GL, color: G }}
              >
                <Icons.Key />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  Restablecer Contraseña
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {usuario.codigo} · {usuario.nombre}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
            >
              <Icons.X />
            </button>
          </div>

          <div className="px-7 py-6 space-y-4">
            {claveTemp ? (
              <>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Se generó una contraseña temporal. Cópiala y compártela con el
                  usuario. Deberá cambiarla en su primer ingreso.
                </p>
                <div className="rounded-xl border-2 border-dashed p-4 text-center space-y-3" style={{ borderColor: GB }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: G }}>
                    Contraseña temporal
                  </p>
                  <p className="text-xl font-mono font-extrabold tracking-wider select-all" style={{ color: "var(--muni-text)" }}>
                    {claveTemp}
                  </p>
                  <button
                    onClick={copyClave}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: G, color: "#fff" }}
                  >
                    {copied ? <Icons.CheckMark /> : <Icons.Doc />}
                    {copied ? "Copiada" : "Copiar"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Se generará una contraseña temporal segura para este usuario.
                  La contraseña anterior dejará de funcionar inmediatamente.
                </p>
                {error && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 border border-red-100">
                    <Icons.Warning />
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-white transition-all"
            >
              {claveTemp ? "Cerrar" : "Cancelar"}
            </button>
            {!claveTemp && (
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-60"
                style={{ backgroundColor: G }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Generando…
                  </>
                ) : (
                  <>
                    <Icons.Refresh /> Restablecer
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
