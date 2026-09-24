import { useState, useEffect, useRef } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"

export default function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
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
    <div ref={ref} className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-white border rounded-lg outline-none transition-all text-left"
          style={{
            borderColor: open ? G : "#D1D5DB",
            boxShadow: open ? `0 0 0 3px ${G}22` : "none",
          }}
        >
          <span className="text-gray-800 font-medium">{value}</span>
          <span className="text-gray-400 ml-2 shrink-0">
            {open ? <Icons.ChevUp /> : <Icons.ChevDown />}
          </span>
        </button>
        {open && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[300] overflow-hidden"
            style={{ animation: "dropIn 0.13s ease-out" }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors hover:bg-gray-50"
                style={{
                  backgroundColor: opt === value ? GL : undefined,
                  color: opt === value ? G : "#374151",
                }}
              >
                <span className="font-medium">{opt}</span>
                {opt === value && (
                  <span style={{ color: G }}>
                    <Icons.CheckMark />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
