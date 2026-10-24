import { useState, useEffect, useRef } from "react"
import { G, GL, GB } from "@/constants/theme"
import { ACCENT_COLORS } from "@/models/configuracion"
import ToggleSwitch from "@/views/common/ToggleSwitch"
import { cambiarClave } from "@/api/auth"
import {
  obtenerPerfil,
  guardarPerfil,
  obtenerNotificaciones,
  guardarNotificaciones,
  patchPreferencia,
  obtenerInicial,
  type Perfil,
} from "@/api/configuracion"

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function comprimirImagen(file: File, maxLado = 512, calidad = 0.85): Promise<string> {
  const dataUrl = await fileToBase64(file)
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return dataUrl
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = dataUrl
    })
    const escala = Math.min(1, maxLado / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * escala))
    const h = Math.max(1, Math.round(img.height * escala))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return dataUrl
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL("image/jpeg", calidad)
  } catch {
    return dataUrl
  }
}

export default function ConfiguracionView({
  onToast,
  dark,
  onDark,
  accent,
  onAccent,
  onPerfilGuardado,
}: {
  onToast: (m: string, s: string) => void
  dark: boolean
  onDark: (v: boolean) => void
  accent: string
  onAccent: (v: string) => void
  onPerfilGuardado?: (u: { nombre_completo: string; foto?: string | null }) => void
}) {
  const [darkMode, setDarkMode] = useState(dark)
  useEffect(() => setDarkMode(dark), [dark])

  const [notifEmail, setNotifEmail] = useState(true)
  const [notifSistema, setNotifSistema] = useState(true)
  const [notifVenc, setNotifVenc] = useState(true)
  const [accentColor, setAccentColor] = useState("#1E5E2F")
  const [accentColors, setAccentColors] = useState<string[]>(ACCENT_COLORS)

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [perfilNombre, setPerfilNombre] = useState("")
  const [perfilApellido, setPerfilApellido] = useState("")
  const [perfilTelefono, setPerfilTelefono] = useState("")
  const [perfilWhatsapp, setPerfilWhatsapp] = useState("")
  const [perfilFoto, setPerfilFoto] = useState("")
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const [claveActual, setClaveActual] = useState("")
  const [claveNueva, setClaveNueva] = useState("")
  const [claveConfirmar, setClaveConfirmar] = useState("")
  const [savingClave, setSavingClave] = useState(false)

  useEffect(() => {
    obtenerPerfil()
      .then((p) => {
        setPerfil(p)
        setPerfilNombre(p.nombre ?? "")
        setPerfilApellido(p.apellido ?? "")
        setPerfilTelefono(p.telefono ?? "")
        setPerfilWhatsapp(p.whatsapp ?? "")
        setPerfilFoto(p.foto ?? "")
      })
      .catch(() => {})
    obtenerNotificaciones()
      .then((n) => {
        setNotifEmail(n.notif_correo)
        setNotifSistema(n.notif_sistema)
        setNotifVenc(n.alertas_vencimiento)
      })
      .catch(() => {})
    obtenerInicial()
      .then((d) => {
        const colors = (d.identidad.colores_acento || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        if (colors.length) setAccentColors(colors)
      })
      .catch(() => {})
  }, [])

  const persistir = (campo: string, valor: unknown) => {
    patchPreferencia(campo, valor).catch(() => {})
  }

  const guardarNotifs = async () => {
    try {
      await guardarNotificaciones({
        notif_correo: notifEmail,
        notif_sistema: notifSistema,
        alertas_vencimiento: notifVenc,
      })
      onToast("Preferencias guardadas", "La configuración de notificaciones fue actualizada.")
    } catch {
      onToast("Error", "No se pudo guardar la configuración de notificaciones.")
    }
  }

  const guardarPerfilPropio = async () => {
    try {
      const p = await guardarPerfil({
        nombre: perfilNombre.trim() || undefined,
        apellido: perfilApellido.trim() || undefined,
        telefono: perfilTelefono.trim() || undefined,
        whatsapp: perfilWhatsapp.trim(),
        foto: perfilFoto || undefined,
      })
      setPerfil((prev) => (prev ? { ...prev, ...p } : prev))
      const nombre = p.nombre ?? perfilNombre.trim()
      const apellido = p.apellido ?? perfilApellido.trim()
      setPerfilNombre(nombre)
      setPerfilApellido(apellido)
      setPerfilWhatsapp(p.whatsapp ?? "")
      setPerfilFoto(p.foto ?? "")
      onPerfilGuardado?.({
        nombre_completo: `${nombre} ${apellido}`.trim(),
        foto: p.foto ?? null,
      })
      onToast("Perfil actualizado", "Los datos de usuario fueron guardados correctamente.")
    } catch {
      onToast("Error", "No se pudo actualizar el perfil.")
    }
  }

  const onFotoSeleccionada = async (file: File) => {
    try {
      const b64 = await comprimirImagen(file)
      setPerfilFoto(b64)
      onToast("Foto cargada", "La foto se guardará al presionar Guardar Perfil.")
    } catch {
      onToast("Error", "No se pudo leer la imagen.")
    }
  }

  const guardarClave = async () => {
    if (!claveActual || !claveNueva || !claveConfirmar) {
      onToast("Revisar formulario", "Todos los campos son obligatorios.")
      return
    }
    if (claveNueva.length < 8) {
      onToast("Revisar formulario", "La nueva clave debe tener mínimo 8 caracteres.")
      return
    }
    if (claveNueva !== claveConfirmar) {
      onToast("Revisar formulario", "La confirmación no coincide con la nueva clave.")
      return
    }
    setSavingClave(true)
    try {
      await cambiarClave(claveActual, claveNueva)
      onToast("Contraseña actualizada", "Su clave fue cambiada correctamente.")
      setClaveActual("")
      setClaveNueva("")
      setClaveConfirmar("")
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cambiar la clave.")
    } finally {
      setSavingClave(false)
    }
  }

  const nombreCompleto = `${perfilNombre} ${perfilApellido}`.trim()
  const iniciales =
    `${perfilNombre?.[0] ?? ""}${perfilApellido?.[0] ?? ""}`.toUpperCase() || "US"

  const SettingRow = ({
    title,
    desc,
    control,
  }: {
    title: string
    desc: string
    control: React.ReactNode
  }) => (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      {control}
    </div>
  )

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">
      {children}
    </p>
  )

  return (
    <div className="flex-1 overflow-auto" style={{ background: "var(--gray-50)" }}>
      <div className="px-6 py-5 space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
            Configuración del Sistema
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de preferencias de interfaz, seguridad y notificaciones.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <SectionTitle>Tema de Interfaz</SectionTitle>
            <div className="rounded-xl border border-gray-100 px-5 divide-y divide-gray-50">
              <SettingRow
                title="Modo Oscuro (Dark Theme)"
                desc="Cambia la interfaz entre tema claro y oscuro para reducir la fatiga visual."
                control={
                  <ToggleSwitch
                    on={darkMode}
                    onChange={(v) => {
                      setDarkMode(v)
                      onDark(v)
                      persistir("tema", v ? "oscuro" : "claro")
                      onToast(
                        v ? "Modo oscuro activado" : "Modo claro activado",
                        "El tema de la interfaz ha sido actualizado.",
                      )
                    }}
                  />
                }
              />
            </div>
          </div>

          <div>
            <SectionTitle>Color de Acento del Sistema</SectionTitle>
            <div className="rounded-xl border border-gray-100 px-5 py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">Color Principal</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Color de botones, indicadores activos y elementos de marca.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {accentColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setAccentColor(c)
                        onAccent(c)
                        persistir("color_acento", c)
                        onToast("Color actualizado", `Color de acento cambiado a ${c}.`)
                      }}
                      className="w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-95"
                      style={{
                        backgroundColor: c,
                        boxShadow:
                          accentColor === c
                            ? `0 0 0 3px white, 0 0 0 5px ${c}`
                            : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionTitle>Canales de Notificación</SectionTitle>
            <div className="rounded-xl border border-gray-100 px-5 divide-y divide-gray-50">
              <SettingRow
                title="Notificaciones del Sistema"
                desc="Alertas dentro del portal para actividades que requieren acción."
                control={<ToggleSwitch on={notifSistema} onChange={setNotifSistema} />}
              />
              <SettingRow
                title="Alertas de Vencimiento"
                desc="Avisos preventivos antes de vencer facturas u órdenes."
                control={<ToggleSwitch on={notifVenc} onChange={setNotifVenc} />}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={guardarNotifs}
              className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: G }}
            >
              Guardar Cambios
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <SectionTitle>Información Personal</SectionTitle>
            <div className="rounded-xl border border-gray-100 p-5 space-y-4">
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className="w-20 h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center"
                    style={{ borderColor: GB, backgroundColor: GL }}
                  >
                    {perfilFoto ? (
                      <img
                        src={perfilFoto}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-extrabold" style={{ color: G }}>
                        {iniciales}
                      </span>
                    )}
                  </div>
                  <input
                    ref={fotoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) onFotoSeleccionada(f)
                      e.target.value = ""
                    }}
                  />
                  <button
                    onClick={() => fotoInputRef.current?.click()}
                    className="text-xs font-bold px-3 py-1 rounded-lg transition-all hover:opacity-80"
                    style={{ backgroundColor: GL, color: G }}
                  >
                    Cambiar foto
                  </button>
                </div>
                <div>
                  <p className="text-base font-extrabold text-gray-900">
                    {nombreCompleto || "Cargando…"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {perfil?.cargo ?? "—"}
                    {perfil?.nombre_dependencia ? ` · ${perfil.nombre_dependencia}` : ""}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Nombre
                  </label>
                  <input
                    value={perfilNombre}
                    onChange={(e) => setPerfilNombre(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Apellido
                  </label>
                  <input
                    value={perfilApellido}
                    onChange={(e) => setPerfilApellido(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Cargo
                  </label>
                  <input
                    value={perfil?.cargo ?? ""}
                    readOnly
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    value={perfil?.correo ?? ""}
                    readOnly
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Teléfono
                  </label>
                  <input
                    value={perfilTelefono}
                    onChange={(e) => setPerfilTelefono(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    WhatsApp
                  </label>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <span className="px-3 py-2.5 text-sm font-semibold text-gray-500 bg-gray-50 border-r border-gray-200 shrink-0">
                      +502
                    </span>
                    <input
                      value={perfilWhatsapp}
                      onChange={(e) =>
                        setPerfilWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 8))
                      }
                      inputMode="numeric"
                      placeholder="55512345"
                      className="w-full px-3 py-2.5 text-sm border-0 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={guardarPerfilPropio}
              className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: G }}
            >
              Guardar Perfil
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <SectionTitle>Cambiar Contraseña</SectionTitle>
          <div className="rounded-xl border border-gray-100 p-5 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Contraseña actual
              </label>
              <input
                type="password"
                value={claveActual}
                onChange={(e) => setClaveActual(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={claveNueva}
                onChange={(e) => setClaveNueva(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={claveConfirmar}
                onChange={(e) => setClaveConfirmar(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"
              />
            </div>
            <button
              onClick={guardarClave}
              disabled={savingClave}
              className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
              style={{ backgroundColor: G }}
            >
              {savingClave ? "Cambiando…" : "Cambiar Contraseña"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
