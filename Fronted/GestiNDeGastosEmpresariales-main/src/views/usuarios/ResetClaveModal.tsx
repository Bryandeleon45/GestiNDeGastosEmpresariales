import { useState, useEffect } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import type { UsuarioRecord } from "@/models/usuarios"

export default function ResetClaveModal({
  usuario,
  onClose,
  onSave,
}: {
  usuario: UsuarioRecord
  onClose: () => void
  onSave: (clave: string) => Promise<void>
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const [pass, setPass] = useState("")
  const [passConf, setPassConf] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const handleSave = async () => {
    const e: Record<string, string> = {}
    if (pass.length < 8) e.pass = "Mínimo 8 caracteres"
    if (pass !== passConf) e.passConf = "Las contraseñas no coinciden"
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSaving(true)
    try {
      await onSave(pass)
      handleClose()
    } catch (err) {
      setErrors({
        general:
          err instanceof Error ? err.message : "No se pudo establecer la contraseña",
      })
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-colors focus:border-[#1E5E2F]"
  const labelCls = "block text-xs font-bold text-gray-600 mb-1"
  const errCls = "text-[10px] text-red-500 mt-0.5"

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
                  Establecer Contraseña
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
            <p className="text-xs text-gray-500 leading-relaxed">
              Asigne una contraseña temporal. El usuario deberá cambiarla en su
              próximo ingreso al sistema.
            </p>
            <div>
              <label className={labelCls}>
                Contraseña Temporal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={inputCls + " pr-10"}
                  style={{ borderColor: errors.pass ? "#DC2626" : "#E5E7EB" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icons.Eye />
                </button>
              </div>
              {errors.pass && <p className={errCls}>{errors.pass}</p>}
            </div>
            <div>
              <label className={labelCls}>
                Confirmar Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type={showPass ? "text" : "password"}
                value={passConf}
                onChange={(e) => setPassConf(e.target.value)}
                placeholder="Repita la contraseña"
                className={inputCls}
                style={{ borderColor: errors.passConf ? "#DC2626" : "#E5E7EB" }}
              />
              {errors.passConf && <p className={errCls}>{errors.passConf}</p>}
            </div>
            {errors.general && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 border border-red-100">
                <Icons.Warning />
                {errors.general}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-white transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-60"
              style={{ backgroundColor: G }}
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <Icons.CheckMark /> Establecer Contraseña
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
