import { useState, useEffect, useRef, useCallback } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { estiloDe, tiempoRelativo } from "@/models/notificaciones"
import {
  obtenerNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "@/api/notificaciones"

// Forma común entre las notificaciones del admin (/api/notificaciones)
// y las del portal de proveedores (/api/portal/notificaciones).
export interface NotifItem {
  id_notificacion: number
  tipo: string
  titulo: string
  mensaje: string | null
  referencia: string | null
  leida: boolean
  fecha: string
}

export interface NotificationBellProps {
  onNavegar: (nav: string) => void
  obtener?: () => Promise<{ data: NotifItem[]; no_leidas: number }>
  marcarUna?: (id: number) => Promise<unknown>
  marcarTodas?: () => Promise<unknown>
  destino?: (tipo: string) => string
  // Texto del botón inferior; null lo oculta (portal no tiene bitácora).
  verTodas?: string | null
  tema?: "claro" | "oscuro"
}

export default function NotificationBell({
  onNavegar,
  obtener = obtenerNotificaciones,
  marcarUna = marcarNotificacionLeida,
  marcarTodas = marcarTodasLeidas,
  destino = (tipo) => estiloDe(tipo).nav ?? "dashboard",
  verTodas = "Ver todas las actividades",
  tema = "claro",
}: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotifItem[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const cargar = useCallback(async () => {
    try {
      const r = await obtener()
      setNotifs(r.data)
      setNoLeidas(r.no_leidas)
    } catch {
      // Sin conexión se conserva la última lista conocida.
    } finally {
      setCargando(false)
    }
  }, [obtener])

  useEffect(() => {
    cargar()
    const id = setInterval(cargar, 60_000)
    return () => clearInterval(id)
  }, [cargar])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const abrir = () => {
    setOpen((o) => !o)
    if (!open) cargar()
  }

  const marcarUnaNotif = async (n: NotifItem) => {
    if (n.leida) return
    setNotifs((ns) =>
      ns.map((x) =>
        x.id_notificacion === n.id_notificacion ? { ...x, leida: true } : x,
      ),
    )
    setNoLeidas((c) => Math.max(0, c - 1))
    try {
      await marcarUna(n.id_notificacion)
    } catch {
      cargar()
    }
  }

  const marcarTodo = async () => {
    setNotifs((ns) => ns.map((x) => ({ ...x, leida: true })))
    setNoLeidas(0)
    try {
      await marcarTodas()
    } catch {
      cargar()
    }
  }

  const abrirNotificacion = (n: NotifItem) => {
    marcarUnaNotif(n)
    setOpen(false)
    const nav = destino(n.tipo)
    if (nav) onNavegar(nav)
  }

  const oscuro = tema === "oscuro"
  const iconColor = hovered || open ? G : oscuro ? "#CBD5E1" : "#4A5568"
  const iconBg =
    hovered || open ? (oscuro ? "rgba(34,197,94,0.15)" : "#F0FDF4") : "transparent"

  const c = {
    panelBg: oscuro ? "#1E293B" : "#FFFFFF",
    panelBorder: oscuro ? "#334155" : "#F3F4F6",
    divider: oscuro ? "rgba(148,163,184,0.14)" : "#F9FAFB",
    title: oscuro ? "#F8FAFC" : "#111827",
    readTitle: oscuro ? "#94A3B8" : "#4B5563",
    muted: oscuro ? "#94A3B8" : "#9CA3AF",
    empty1: oscuro ? "#94A3B8" : "#6B7280",
    empty2: oscuro ? "#64748B" : "#9CA3AF",
    itemRead: oscuro ? "#0F172A" : "var(--gray-50)",
    itemUnread: oscuro ? "rgba(34,197,94,0.10)" : "var(--brand-light)",
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={abrir}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex items-center justify-center rounded-full transition-all duration-150"
        style={{
          width: 40,
          height: 40,
          backgroundColor: iconBg,
          color: iconColor,
        }}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {noLeidas > 0 && (
          <span
            className="absolute flex items-center justify-center text-white font-extrabold rounded-full border-2 transition-all"
            style={{
              top: 6,
              right: 6,
              width: noLeidas > 9 ? 16 : 12,
              height: 12,
              fontSize: 8,
              backgroundColor: "#E53E3E",
              borderColor: oscuro ? "#1E293B" : "#FFFFFF",
              lineHeight: 1,
            }}
          >
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 rounded-2xl border shadow-2xl z-[400] overflow-hidden"
          style={{
            width: 340,
            backgroundColor: c.panelBg,
            borderColor: c.panelBorder,
            animation: "dropIn 0.18s cubic-bezier(.16,1,.3,1)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3.5 border-b"
            style={{ borderColor: c.panelBorder }}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: c.title }}>
                Notificaciones
              </h3>
              {noLeidas > 0 && (
                <span
                  className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: "#E53E3E" }}
                >
                  {noLeidas}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodo}
                  className="text-[11px] font-semibold transition-colors hover:opacity-70"
                  style={{ color: G }}
                >
                  Marcar como leídas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg transition-colors hover:opacity-70"
                style={{ color: c.muted }}
              >
                <Icons.X />
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {cargando && notifs.length === 0 && (
              <div
                className="px-4 py-8 text-center text-xs font-semibold"
                style={{ color: c.muted }}
              >
                Cargando notificaciones…
              </div>
            )}

            {!cargando && notifs.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p
                  className="text-xs font-semibold"
                  style={{ color: c.empty1 }}
                >
                  No tienes notificaciones
                </p>
                <p
                  className="text-[11px] mt-1"
                  style={{ color: c.empty2 }}
                >
                  Aquí aparecerán las alertas del sistema.
                </p>
              </div>
            )}

            {notifs.map((n) => {
              const leida = n.leida
              return (
                <button
                  key={n.id_notificacion}
                  onClick={() => abrirNotificacion(n)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b last:border-0 group"
                  style={{
                    backgroundColor: leida ? c.itemRead : c.itemUnread,
                    borderColor: c.divider,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-xs leading-snug"
                        style={{
                          color: leida ? c.readTitle : c.title,
                          fontWeight: leida ? 500 : 700,
                        }}
                      >
                        {n.titulo}
                      </p>
                      {!leida && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0 mt-1"
                          style={{ backgroundColor: "#E53E3E" }}
                        />
                      )}
                    </div>
                    {n.mensaje && (
                      <p
                        className="text-[11px] mt-0.5 leading-relaxed line-clamp-2"
                        style={{ color: c.muted }}
                      >
                        {n.mensaje}
                      </p>
                    )}
                    <p
                      className="text-[10px] font-semibold mt-1"
                      style={{ color: leida ? c.muted : G }}
                    >
                      {tiempoRelativo(n.fecha)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {verTodas !== null && (
            <div
              className="border-t px-4 py-3"
              style={{ borderColor: c.panelBorder }}
            >
              <button
                onClick={() => {
                  setOpen(false)
                  onNavegar("bitacora")
                }}
                className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 text-white"
                style={{ backgroundColor: G }}
              >
                {verTodas}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
