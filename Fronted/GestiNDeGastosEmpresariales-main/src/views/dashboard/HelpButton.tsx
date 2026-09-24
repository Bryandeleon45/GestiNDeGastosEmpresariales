import { useState, useEffect, useRef } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { FAQ_LINKS } from "@/models/ayuda"

export default function HelpButton({
  onOpenTicket,
}: {
  onOpenTicket: () => void
}) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [query, setQuery] = useState("")
  const [focusSearch, setFocusSearch] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const filtered = FAQ_LINKS.filter(
    (f) => !query || f.q.toLowerCase().includes(query.toLowerCase()),
  )
  const iconColor = hovered || open ? G : "#4A5568"
  const iconBg = hovered || open ? "#F0FDF4" : "transparent"

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center justify-center rounded-full transition-all duration-150"
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
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl z-[400] overflow-hidden"
          style={{
            width: 300,
            animation: "dropIn 0.18s cubic-bezier(.16,1,.3,1)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: G }}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                Centro de Ayuda
              </h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <Icons.X />
            </button>
          </div>

          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Icons.Search />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocusSearch(true)}
                onBlur={() => setFocusSearch(false)}
                placeholder="Buscar en la documentación..."
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border rounded-xl outline-none transition-all placeholder-gray-400"
                style={{
                  borderColor: focusSearch ? G : "#E5E7EB",
                  boxShadow: focusSearch ? `0 0 0 3px ${G}22` : "none",
                }}
              />
            </div>
          </div>

          <div className="px-4 pb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Accesos Rápidos
            </p>
            <div className="space-y-0.5">
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">
                  Sin resultados para "{query}"
                </p>
              ) : (
                filtered.map((f) => (
                  <button
                    key={f.q}
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all group hover:bg-gray-50"
                  >
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
                      style={{ backgroundColor: GL }}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke={G}
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                      >
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      {f.q}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4 my-2" />

          <div className="px-4 pb-4">
            <div
              className="rounded-xl border p-3.5 flex items-center gap-3 mb-3"
              style={{ backgroundColor: GL, borderColor: GB }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: G }}
              >
                <Icons.Headset />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800 leading-none">
                  Soporte DAFIM
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Tiempo de respuesta ≤ 4 h hábiles
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setOpen(false)
                onOpenTicket()
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 text-white"
              style={{ backgroundColor: G }}
            >
              Abrir Ticket de Soporte →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
