import { useEffect, useRef, useState } from "react"

// Campo de fecha que siempre se muestra como dd/mm/aaaa,
// con botón de calendario que abre el selector nativo oculto.
// Internamente guarda el valor en ISO (YYYY-MM-DD) para el backend.
export default function DateInput({
  value,
  onChange,
  min,
  max,
  className,
  style,
  placeholder,
}: {
  value: string
  onChange: (iso: string) => void
  min?: string
  max?: string
  className?: string
  style?: React.CSSProperties
  placeholder?: string
}) {
  const [texto, setTexto] = useState(isoADisplay(value))
  const [focused, setFocused] = useState(false)
  const nativeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!focused) setTexto(isoADisplay(value))
  }, [value, focused])

  const abrirPicker = () => {
    nativeRef.current?.showPicker?.()
  }

  const aplicarTexto = (t: string) => {
    setTexto(t)
    const iso = displayAIso(t)
    if (iso != null) onChange(iso)
  }

  const syncDesdeNative = (iso: string) => {
    setTexto(isoADisplay(iso))
    onChange(iso)
  }

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-1.5 ${className ?? ""}`}
        style={{
          ...style,
          borderColor: focused ? "#16A34A" : style?.borderColor,
        }}
      >
        <input
          value={texto}
          onChange={(e) => aplicarTexto(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            setTexto(isoADisplay(value))
          }}
          placeholder={placeholder ?? "dd/mm/aaaa"}
          inputMode="numeric"
          className="flex-1 min-w-0 bg-transparent outline-none"
          style={{ color: "inherit", fontSize: "inherit" }}
        />
        <button
          type="button"
          onClick={abrirPicker}
          title="Abrir calendario"
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: "inherit" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>
      <input
        ref={nativeRef}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => syncDesdeNative(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only absolute bottom-0 left-0 w-px h-px opacity-0 pointer-events-none"
      />
    </div>
  )
}

// "2026-10-04" -> "04/10/2026"
function isoADisplay(iso: string): string {
  if (!iso) return ""
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ""
  return `${m[3]}/${m[2]}/${m[1]}`
}

// "04/10/2026" -> "2026-10-04" (o null si es inválido)
function displayAIso(t: string): string | null {
  const limpio = t.replace(/[./\-\s]/g, "")
  if (!/^\d{6,8}$/.test(limpio)) return null
  const d = parseInt(limpio.slice(0, 2), 10)
  const m = parseInt(limpio.slice(2, 4), 10)
  const a = limpio.length >= 8 ? parseInt(limpio.slice(4, 8), 10) : parseInt(limpio.slice(4, 6), 10)
  if (!d || !m || !a) return null
  if (m < 1 || m > 12) return null
  if (d < 1 || d > 31) return null
  const anio = a < 100 ? 2000 + a : a
  return `${anio}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}
