import { useEffect, useState } from "react"
import { G } from "@/constants/theme"
import { obtenerIdentidad, guardarIdentidad, type Identidad } from "@/api/configuracion"

function Field({
  label,
  value,
  onChange,
  ph,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  ph?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <input
        value={value}
        placeholder={ph}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 transition-colors"
      />
    </div>
  )
}

const CAMPOS: { key: keyof Identidad; label: string }[] = [
  { key: "nombre_institucion", label: "Nombre de la institución" },
  { key: "nombre_corto", label: "Nombre corto" },
  { key: "nombre_sistema", label: "Nombre del sistema" },
  { key: "subtitulo_gestion", label: "Subtítulo gestión" },
  { key: "subtitulo_portal", label: "Subtítulo portal" },
  { key: "lema", label: "Lema" },
  { key: "nit_institucional", label: "NIT institucional" },
  { key: "direccion", label: "Dirección" },
  { key: "telefono", label: "Teléfono" },
  { key: "correo_contacto", label: "Correo de contacto" },
  { key: "color_principal", label: "Color principal (hex)" },
  { key: "colores_acento", label: "Colores de acento (separados por coma)" },
]

export default function InstitucionalTab({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    obtenerIdentidad()
      .then((d) => {
        const f: Record<string, string> = {}
        for (const c of CAMPOS) f[c.key] = (d[c.key] ?? "") as string
        setForm(f)
      })
      .catch(() => onToast("Error", "No se pudo cargar la identidad institucional."))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: string, v: string) => setForm((prev) => ({ ...prev, [key]: v }))

  const guardar = async () => {
    setSaving(true)
    try {
      await guardarIdentidad(form)
      onToast("Identidad guardada", "Los datos institucionales fueron actualizados.")
    } catch {
      onToast("Error", "No se pudo guardar la identidad institucional.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-gray-900">Identidad Institucional</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Nombre, datos de contacto y colores que aparecen en el login, el
          encabezado y los PDF generados por el sistema.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Cargando identidad…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAMPOS.map((c) => (
            <Field
              key={c.key}
              label={c.label}
              value={form[c.key] ?? ""}
              onChange={(v) => set(c.key, v)}
            />
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={guardar}
          disabled={saving || loading}
          className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
          style={{ backgroundColor: G }}
        >
          {saving ? "Guardando…" : "Guardar Identidad"}
        </button>
      </div>
    </div>
  )
}
