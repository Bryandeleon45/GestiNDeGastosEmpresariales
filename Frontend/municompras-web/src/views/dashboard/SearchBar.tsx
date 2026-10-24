import { useState, useEffect, useRef } from "react"
import { G, GL, GB, BRAND_HEX } from "@/constants/theme"
import { buscarGlobal } from "@/api/busqueda"
import {
  RESULT_TYPE_LABEL,
  type SearchResult,
  type SearchResultType,
} from "@/models/busqueda"

const RESULT_ICON: Record<SearchResultType, React.ReactElement> = {
  solicitud: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  proveedor: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  stock: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
    >
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
}

function escaparRegex(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export default function SearchBar({
  onResultado,
}: {
  onResultado?: (r: SearchResult) => void
}) {
  const [query, setQuery] = useState("")
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [cargando, setCargando] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const peticionRef = useRef(0)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setFocused(false)
      }
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [])

  const trimmed = query.trim()

  useEffect(() => {
    const id = ++peticionRef.current
    if (trimmed.length < 2) {
      setResultados([])
      setCargando(false)
      return
    }
    setCargando(true)
    const t = setTimeout(() => {
      buscarGlobal(trimmed)
        .then((res) => {
          if (id === peticionRef.current) setResultados(res)
        })
        .catch(() => {
          if (id === peticionRef.current) setResultados([])
        })
        .finally(() => {
          if (id === peticionRef.current) setCargando(false)
        })
    }, 300)
    return () => clearTimeout(t)
  }, [trimmed])

  const groups: Record<SearchResultType, SearchResult[]> = {
    solicitud: [],
    proveedor: [],
    stock: [],
  }
  resultados.forEach((r) => groups[r.type].push(r))
  const orderedTypes: SearchResultType[] = ["solicitud", "proveedor", "stock"]
  const mostrarDropdown = focused

  const isActive = focused
  const isHovered = hovered && !focused

  let borderColor = "#E2E8F0"
  if (isActive) borderColor = G
  else if (isHovered) borderColor = "#CBD5E1"

  let bgColor = "#F8FAFC"
  if (isActive) bgColor = "#FFFFFF"

  let boxShadow = "none"
  if (isActive) boxShadow = `0 0 0 3px ${BRAND_HEX}22, 0 1px 3px rgba(0,0,0,0.06)`
  else if (isHovered) boxShadow = "0 1px 4px rgba(0,0,0,0.08)"

  const iconColor = isActive ? G : "#94A3B8"

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-2.5 px-4"
        style={{
          height: 42,
          borderRadius: 24,
          backgroundColor: bgColor,
          border: `1.5px solid ${borderColor}`,
          boxShadow,
          transition: "all 0.15s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <svg
          className="w-4 h-4 shrink-0 transition-colors duration-150"
          fill="none"
          stroke={iconColor}
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Buscar solicitud o proveedor..."
          className="flex-1 min-w-0 bg-transparent outline-none text-sm"
          style={
            {
              color: "#1E293B",
              caretColor: G,
              fontSize: 14,
            } as React.CSSProperties
          }
        />
        {cargando && (
          <svg
            className="w-4 h-4 shrink-0 animate-spin"
            fill="none"
            stroke={G}
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <circle cx="12" cy="12" r="10" opacity="0.25" />
            <path d="M12 2a10 10 0 019.95 9" strokeLinecap="round" />
          </svg>
        )}
        {query.length > 0 && !cargando && (
          <button
            onClick={() => {
              setQuery("")
              setResultados([])
              inputRef.current?.focus()
            }}
            className="w-5 h-5 flex items-center justify-center rounded-full shrink-0 transition-colors hover:bg-gray-200 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        {!focused && !query && (
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-semibold text-gray-400 shrink-0">
            <span className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50">
              ⌘
            </span>
            <span className="px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50">
              K
            </span>
          </kbd>
        )}
      </div>

      {mostrarDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 overflow-hidden z-[500]"
          style={{
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            animation: "dropIn 0.16s cubic-bezier(.16,1,.3,1)",
            maxHeight: 400,
            overflowY: "auto",
          }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {trimmed.length >= 2
                ? `Resultados para "${trimmed}"`
                : "Búsqueda global"}
            </p>
            {resultados.length > 0 && !cargando && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {resultados.length}
              </span>
            )}
          </div>

          {trimmed.length < 2 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-gray-400">
                Escribe al menos 2 caracteres para buscar en solicitudes,
                proveedores e inventario.
              </p>
            </div>
          ) : cargando && resultados.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-semibold text-gray-400">
                Buscando…
              </p>
            </div>
          ) : resultados.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-semibold text-gray-400">
                Sin resultados para "{trimmed}"
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Intenta con número de solicitud, proveedor o artículo
              </p>
            </div>
          ) : (
            orderedTypes.map((type) => {
              const items = groups[type]
              if (items.length === 0) return null
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/60 border-t border-gray-50">
                    <span className="text-gray-400">{RESULT_ICON[type]}</span>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {RESULT_TYPE_LABEL[type]}
                    </p>
                  </div>
                  {items.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelected(r.id)
                        setFocused(false)
                        onResultado?.(r)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all group border-b border-gray-50 last:border-0"
                      style={{
                        backgroundColor: selected === r.id ? GL : undefined,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#F8FFFE")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          selected === r.id ? GL : "")
                      }
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          backgroundColor:
                            selected === r.id ? GB : "var(--gray-100)",
                          color: selected === r.id ? G : "#64748B",
                        }}
                      >
                        {RESULT_ICON[r.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold text-gray-900 leading-none truncate"
                          dangerouslySetInnerHTML={{
                            __html: trimmed
                              ? r.title.replace(
                                  new RegExp(`(${escaparRegex(trimmed)})`, "gi"),
                                  `<mark style="background:${GL};color:${G};border-radius:2px;padding:0 1px">$1</mark>`,
                                )
                              : r.title,
                          }}
                        />
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {r.meta}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${r.badgeStyle}`}
                      >
                        {r.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
