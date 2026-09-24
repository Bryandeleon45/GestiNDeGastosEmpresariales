import { useState, useEffect, useRef } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { NOTIFS_DEFAULT, type NotifItem } from "@/models/notificaciones"

export default function NotificationBell({
  onOpenAudit,
}: {
  onOpenAudit: () => void
}) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotifItem[]>(NOTIFS_DEFAULT)
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const unreadCount = notifs.filter((n) => n.unread).length
  const markAllRead = () =>
    setNotifs((ns) => ns.map((n) => ({ ...n, unread: false })))
  const markOneRead = (id: string) =>
    setNotifs((ns) =>
      ns.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    )

  const iconColor = hovered || open ? G : "#4A5568"
  const iconBg = hovered || open ? "#F0FDF4" : "transparent"

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
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
        {unreadCount > 0 && (
          <span
            className="absolute flex items-center justify-center text-white font-extrabold rounded-full border-2 border-white transition-all"
            style={{
              top: 6,
              right: 6,
              width: unreadCount > 9 ? 16 : 12,
              height: 12,
              fontSize: 8,
              backgroundColor: "#E53E3E",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl z-[400] overflow-hidden"
          style={{
            width: 340,
            animation: "dropIn 0.18s cubic-bezier(.16,1,.3,1)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: "#E53E3E" }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-semibold transition-colors hover:opacity-70"
                  style={{ color: G }}
                >
                  Marcar como leídas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <Icons.X />
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => markOneRead(n.id)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-0 group"
                style={{ backgroundColor: n.unread ? "#FAFFFE" : "white" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 mt-0.5"
                  style={{ backgroundColor: `${n.color}15` }}
                >
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-xs leading-snug ${
                        n.unread
                          ? "font-bold text-gray-900"
                          : "font-medium text-gray-600"
                      }`}
                    >
                      {n.title}
                    </p>
                    {n.unread && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0 mt-1"
                        style={{ backgroundColor: "#E53E3E" }}
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                    {n.body}
                  </p>
                  <p
                    className="text-[10px] font-semibold mt-1"
                    style={{ color: n.unread ? G : "#9CA3AF" }}
                  >
                    {n.time}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <button
              onClick={() => {
                setOpen(false)
                onOpenAudit()
              }}
              className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 text-white"
              style={{ backgroundColor: G }}
            >
              Ver todas las actividades
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
