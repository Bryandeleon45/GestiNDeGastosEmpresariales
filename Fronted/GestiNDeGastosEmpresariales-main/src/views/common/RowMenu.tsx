import { useState, useEffect, useRef } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"

export default function RowMenu({
  onVer,
  onEditar,
  onAprobar,
  onRechazar,
}: {
  onVer: () => void
  onEditar: () => void
  onAprobar: () => void
  onRechazar: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])
  const items = [
    {
      label: "Ver detalle",
      icon: <Icons.Eye />,
      action: () => {
        onVer()
        setOpen(false)
      },
      color: "#374151",
    },
    {
      label: "Editar",
      icon: <Icons.Pencil />,
      action: () => {
        onEditar()
        setOpen(false)
      },
      color: "#374151",
    },
    {
      label: "Aprobar",
      icon: <Icons.CheckMark />,
      action: () => {
        onAprobar()
        setOpen(false)
      },
      color: "#16A34A",
    },
    {
      label: "Rechazar",
      icon: <Icons.X />,
      action: () => {
        onRechazar()
        setOpen(false)
      },
      color: "#DC2626",
    },
  ]
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
        style={open ? { backgroundColor: GL, color: G } : {}}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-100 shadow-xl z-[200] overflow-hidden w-40"
          style={{ animation: "dropIn 0.13s ease-out" }}
        >
          {items.map((it) => (
            <button
              key={it.label}
              onClick={it.action}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-gray-50 font-medium"
              style={{ color: it.color }}
            >
              <span>{it.icon}</span>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
