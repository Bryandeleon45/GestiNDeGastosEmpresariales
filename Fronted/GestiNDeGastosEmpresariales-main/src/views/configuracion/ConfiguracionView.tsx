import { useState, useEffect, useRef } from "react"
import { G, GL, GB } from "@/constants/theme"
import {
  CONFIG_TABS,
  ACCENT_COLORS,
  IDIOMAS,
  ZONAS,
  type ConfigTab,
} from "@/models/configuracion"
import ToggleSwitch from "@/views/common/ToggleSwitch"

export default function ConfiguracionView({
  onToast,
  onLogout,
  dark,
  onDark,
  accent,
  onAccent,
  compact,
  onCompact,
  anim,
  onAnim,
}: {
  onToast: (m: string, s: string) => void
  onLogout: () => void
  dark: boolean
  onDark: (v: boolean) => void
  accent: string
  onAccent: (v: string) => void
  compact: boolean
  onCompact: (v: boolean) => void
  anim: boolean
  onAnim: (v: boolean) => void
}) {
  const [activeTab, setActiveTab] = useState<ConfigTab>("apariencia")
  const [darkMode, setDarkMode] = useState(dark)
  const [compactUI, setCompactUI] = useState(compact)
  const [animaciones, setAnimaciones] = useState(anim)
  useEffect(() => {
    setDarkMode(dark)
  }, [dark])
  useEffect(() => {
    setCompactUI(compact)
  }, [compact])
  useEffect(() => {
    setAnimaciones(anim)
  }, [anim])
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifSistema, setNotifSistema] = useState(true)
  const [notifVenc, setNotifVenc] = useState(true)
  const [accentColor, setAccentColor] = useState("#1E5E2F")
  const [idioma, setIdioma] = useState("Español - Guatemala")
  const [zona, setZona] = useState("UTC-6 America/Guatemala")
  const [showIdiomaDD, setShowIdiomaDD] = useState(false)
  const [showZonaDD, setShowZonaDD] = useState(false)
  const idiomaDDRef = useRef<HTMLDivElement>(null)
  const zonaDDRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        idiomaDDRef.current &&
        !idiomaDDRef.current.contains(e.target as Node)
      )
        setShowIdiomaDD(false)
      if (zonaDDRef.current && !zonaDDRef.current.contains(e.target as Node))
        setShowZonaDD(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

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

  return (
    <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
      <div className="px-6 py-5 space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
            Configuración del Sistema
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de preferencias de interfaz, seguridad y parámetros
            administrativos.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100">
            {CONFIG_TABS.map((tab) => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors shrink-0"
                  style={{ color: active ? G : "#6B7280" }}
                >
                  {tab.label}
                  {active && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                      style={{ backgroundColor: G }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {activeTab === "apariencia" && (
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">
                  Tema de Interfaz
                </p>
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
                          onToast(
                            v ? "Modo oscuro activado" : "Modo claro activado",
                            "El tema de la interfaz ha sido actualizado.",
                          )
                        }}
                      />
                    }
                  />
                  <SettingRow
                    title="Interfaz Compacta"
                    desc="Reduce el espaciado de filas y tarjetas para mostrar más información."
                    control={
                      <ToggleSwitch
                        on={compactUI}
                        onChange={(v) => {
                          setCompactUI(v)
                          onCompact(v)
                        }}
                      />
                    }
                  />
                  <SettingRow
                    title="Animaciones de Transición"
                    desc="Habilita efectos de transición suaves entre vistas y modales."
                    control={
                      <ToggleSwitch
                        on={animaciones}
                        onChange={(v) => {
                          setAnimaciones(v)
                          onAnim(v)
                        }}
                      />
                    }
                  />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">
                  Color de Acento del Sistema
                </p>
                <div className="rounded-xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Color Principal
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Color de botones, indicadores activos y elementos de
                        marca.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ACCENT_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setAccentColor(c)
                            onAccent(c)
                            onToast(
                              "Color actualizado",
                              `Color de acento cambiado a ${c}.`,
                            )
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
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">
                  Idioma y Región
                </p>
                <div className="rounded-xl border border-gray-100 px-5 divide-y divide-gray-50">
                  <div className="flex items-center justify-between gap-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Idioma del Sistema
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Idioma de la interfaz y mensajes del sistema.
                      </p>
                    </div>
                    <div className="relative" ref={idiomaDDRef}>
                      <button
                        onClick={() => setShowIdiomaDD((v) => !v)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all min-w-[200px] justify-between"
                      >
                        {idioma}
                        <svg
                          className="w-3.5 h-3.5 text-gray-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {showIdiomaDD && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden min-w-[200px]">
                          {IDIOMAS.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => {
                                setIdioma(opt)
                                setShowIdiomaDD(false)
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                              style={{
                                color: idioma === opt ? G : "#374151",
                                fontWeight: idioma === opt ? 700 : 400,
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Zona Horaria
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Zona horaria para fechas, logs y notificaciones.
                      </p>
                    </div>
                    <div className="relative" ref={zonaDDRef}>
                      <button
                        onClick={() => setShowZonaDD((v) => !v)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all min-w-[200px] justify-between"
                      >
                        {zona}
                        <svg
                          className="w-3.5 h-3.5 text-gray-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {showZonaDD && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden min-w-[200px]">
                          {ZONAS.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => {
                                setZona(opt)
                                setShowZonaDD(false)
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                              style={{
                                color: zona === opt ? G : "#374151",
                                fontWeight: zona === opt ? 700 : 400,
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() =>
                    onToast(
                      "Configuración guardada",
                      "Los cambios de apariencia han sido aplicados.",
                    )
                  }
                  className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: G }}
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {activeTab === "perfil" && (
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">
                  Información Personal
                </p>
                <div className="rounded-xl border border-gray-100 p-5 space-y-4">
                  <div className="flex items-center gap-5">
                    <div
                      className="w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0"
                      style={{ borderColor: GB }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128&h=128&fit=crop&auto=format"
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-gray-900">
                        Lic. Ricardo Gómez
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Administrador General · Municipalidad de Panajachel
                      </p>
                      <button
                        onClick={() =>
                          onToast(
                            "Función en desarrollo",
                            "La carga de foto de perfil estará disponible próximamente.",
                          )
                        }
                        className="text-xs font-bold mt-2 px-3 py-1 rounded-lg transition-all hover:opacity-80"
                        style={{ backgroundColor: GL, color: G }}
                      >
                        Cambiar foto
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {[
                      {
                        label: "Nombre completo",
                        value: "Ricardo Gómez Barrios",
                      },
                      { label: "Cargo", value: "Director Administrativo" },
                      {
                        label: "Correo electrónico",
                        value: "r.gomez@munipanajachel.gob.gt",
                      },
                      { label: "Extensión", value: "Ext. 214" },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                          {f.label}
                        </label>
                        <input
                          defaultValue={f.value}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    onToast(
                      "Perfil actualizado",
                      "Los datos de usuario fueron guardados correctamente.",
                    )
                  }
                  className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: G }}
                >
                  Guardar Perfil
                </button>
              </div>
            </div>
          )}

          {activeTab === "notificaciones" && (
            <div className="p-6 space-y-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">
                  Canales de Notificación
                </p>
                <div className="rounded-xl border border-gray-100 px-5 divide-y divide-gray-50">
                  <SettingRow
                    title="Notificaciones por Correo"
                    desc="Recibir alertas de solicitudes, vencimientos y aprobaciones por email."
                    control={
                      <ToggleSwitch on={notifEmail} onChange={setNotifEmail} />
                    }
                  />
                  <SettingRow
                    title="Notificaciones del Sistema"
                    desc="Alertas dentro del portal para actividades que requieren acción."
                    control={
                      <ToggleSwitch
                        on={notifSistema}
                        onChange={setNotifSistema}
                      />
                    }
                  />
                  <SettingRow
                    title="Alertas de Vencimiento"
                    desc="Avisos preventivos 48 y 24 horas antes de vencer facturas u órdenes."
                    control={
                      <ToggleSwitch on={notifVenc} onChange={setNotifVenc} />
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    onToast(
                      "Preferencias guardadas",
                      "La configuración de notificaciones fue actualizada.",
                    )
                  }
                  className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: G }}
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {activeTab === "seguridad" && (
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">
                  Contraseña
                </p>
                <div className="rounded-xl border border-gray-100 p-5 space-y-4">
                  {[
                    { label: "Contraseña actual", ph: "••••••••" },
                    { label: "Nueva contraseña", ph: "Mínimo 8 caracteres" },
                    {
                      label: "Confirmar contraseña",
                      ph: "Repetir nueva contraseña",
                    },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                        {f.label}
                      </label>
                      <input
                        type="password"
                        placeholder={f.ph}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      onToast(
                        "Contraseña actualizada",
                        "Su contraseña fue cambiada correctamente.",
                      )
                    }
                    className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                    style={{ backgroundColor: G }}
                  >
                    Cambiar Contraseña
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">
                  Sesión Activa
                </p>
                <div className="rounded-xl border border-gray-100 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Sesión actual
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Chrome · Windows 11 · Panajachel, Sololá · Iniciada hoy
                      08:15 AM
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="px-4 py-2 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90"
                    style={{ backgroundColor: "#DC2626" }}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "auditoria" && (
            <div className="p-6">
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div
                  className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"
                  style={{ backgroundColor: "#F9FAFB" }}
                >
                  <p className="text-sm font-extrabold text-gray-700">
                    Registro de Actividad del Sistema
                  </p>
                  <button
                    onClick={() =>
                      onToast(
                        "Log exportado",
                        "El registro de auditoría fue descargado como CSV.",
                      )
                    }
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:bg-gray-50"
                    style={{ color: G, borderColor: G }}
                  >
                    Exportar CSV
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    {
                      time: "Hoy 09:42",
                      action: "Inicio de sesión",
                      user: "Lic. Ricardo Gómez",
                      status: "exitoso",
                    },
                    {
                      time: "Ayer 17:18",
                      action: "Exportación de reporte PDF",
                      user: "Lic. Ricardo Gómez",
                      status: "exitoso",
                    },
                    {
                      time: "Ayer 14:05",
                      action: "Modificación de proveedor",
                      user: "Asistente Sánchez",
                      status: "exitoso",
                    },
                    {
                      time: "22/10 11:30",
                      action: "Intento de acceso denegado",
                      user: "Usuario desconocido",
                      status: "denegado",
                    },
                    {
                      time: "21/10 08:00",
                      action: "Inicio de sesión",
                      user: "Lic. Ricardo Gómez",
                      status: "exitoso",
                    },
                  ].map((e, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            e.status === "denegado" ? "#DC2626" : G,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {e.action}
                        </p>
                        <p className="text-xs text-gray-400">{e.user}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0">{e.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
