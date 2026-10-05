import { useState, useEffect, useRef } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import type { RolPortal } from "@/api/proveedores"

export default function RolCell({
  rolId,
  rolLabel,
  roles,
  onChange,
}: {
  rolId: number | null
  rolLabel: string
  roles: RolPortal[]
  onChange: (idRol: number, label: string) => void
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
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border rounded-lg transition-all whitespace-nowrap"
        style={{
          borderColor: open ? G : "#D1D5DB",
          color: "#374151",
          boxShadow: open ? `0 0 0 2px ${G}22` : "none",
        }}
      >
        <span>{rolLabel}</span>
        <Icons.ChevDown />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[300] overflow-hidden w-48"
          style={{ animation: "dropIn 0.13s ease-out" }}
        >
          {roles.map((r) => (
            <button
              key={r.id_rol}
              onClick={() => {
                onChange(r.id_rol, r.descripcion)
                setOpen(false)
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors hover:bg-gray-50"
              style={{
                backgroundColor: r.id_rol === rolId ? GL : undefined,
                color: r.id_rol === rolId ? G : "#374151",
              }}
            >
              <span className="font-medium">{r.descripcion}</span>
              {r.id_rol === rolId && (
                <span style={{ color: G }}>
                  <Icons.CheckMark />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
