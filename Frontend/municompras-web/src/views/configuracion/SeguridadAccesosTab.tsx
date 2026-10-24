import { useState } from "react"
import { G } from "@/constants/theme"
import { cambiarClave } from "@/api/auth"

export default function SeguridadAccesosTab({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  return (
    <div className="space-y-6">
      <CambiarClavePanel onToast={onToast} />
    </div>
  )
}

function CambiarClavePanel({ onToast }: { onToast: (m: string, s: string) => void }) {
  const [actual, setActual] = useState("")
  const [nueva, setNueva] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [saving, setSaving] = useState(false)

  const guardar = async () => {
    if (!actual || !nueva || !confirmar) {
      onToast("Revisar formulario", "Todos los campos son obligatorios.")
      return
    }
    if (nueva.length < 8) {
      onToast("Revisar formulario", "La nueva clave debe tener mínimo 8 caracteres.")
      return
    }
    if (nueva !== confirmar) {
      onToast("Revisar formulario", "La confirmación no coincide con la nueva clave.")
      return
    }
    setSaving(true)
    try {
      await cambiarClave(actual, nueva)
      onToast("Contraseña actualizada", "Su clave fue cambiada correctamente.")
      setActual("")
      setNueva("")
      setConfirmar("")
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cambiar la clave.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">Contraseña</p>
      <div className="rounded-xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Contraseña actual</label>
          <input type="password" value={actual} onChange={(e) => setActual(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Nueva contraseña</label>
          <input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Mínimo 8 caracteres" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Confirmar contraseña</label>
          <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors" />
        </div>
        <button
          onClick={guardar}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
          style={{ backgroundColor: G }}
        >
          {saving ? "Cambiando…" : "Cambiar Contraseña"}
        </button>
      </div>
    </div>
  )
}
