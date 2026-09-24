import { useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { STOCK, type StockItem } from "@/models/dashboard"
import StockDetailPopover from "./StockDetailPopover"

export default function StockAlertsCard({
  onRestock,
}: {
  onRestock: (items?: string) => void
}) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<StockItem | null>(null)
  const [btnState, setBtnState] = useState<"default" | "hover" | "pressed">(
    "default",
  )

  const critCount = STOCK.filter((s) => s.level === "CRÍTICO").length

  const badgeStyle = (s: StockItem) =>
    s.level === "CRÍTICO" ? { color: "#DC2626" } : { color: "#D97706" }

  const barColor = (s: StockItem) =>
    s.level === "CRÍTICO" ? "#EF4444" : "#F59E0B"

  const btnBg =
    btnState === "pressed"
      ? "#143E1F"
      : btnState === "hover"
        ? G
        : "transparent"
  const btnTextColor = btnState === "default" ? G : "#FFFFFF"

  return (
    <>
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center gap-2 px-5 pt-5 pb-4">
          <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F59E0B"
            strokeWidth={2.2}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3 className="text-base font-bold text-[#0F172A] leading-none">
            Alertas de Stock Bajo
          </h3>
          {critCount > 0 && (
            <span className="ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 shrink-0">
              {critCount} CRÍTICO
            </span>
          )}
        </div>

        <div className="h-px bg-gray-100 mx-5" />

        <div className="px-5 py-3 space-y-0">
          {STOCK.map((s, i) => (
            <div key={s.id}>
              <div
                onClick={() => setDetailItem(s)}
                onMouseEnter={() => setHoveredItem(s.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative -mx-2 px-2 py-3 rounded-xl cursor-pointer transition-all duration-150 group"
                style={{
                  backgroundColor:
                    hoveredItem === s.id ? "#F9FAFB" : "transparent",
                }}
              >
                {hoveredItem === s.id && (
                  <div
                    className="absolute right-2 -top-9 z-10 px-2.5 py-1.5 text-[11px] font-semibold text-white rounded-lg whitespace-nowrap pointer-events-none"
                    style={{
                      backgroundColor: "#0F172A",
                      animation: "dropIn 0.12s ease-out",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    }}
                  >
                    Clic para ver detalle
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
                      style={{
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderTop: "5px solid #0F172A",
                      }}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-sm font-bold text-gray-900 leading-tight group-hover:underline decoration-dotted underline-offset-2 transition-all">
                    {s.name}
                  </p>
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wide shrink-0"
                    style={badgeStyle(s)}
                  >
                    {s.level}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.pct}%`, backgroundColor: barColor(s) }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-gray-700">
                    Disp: <b>{s.disp.toLocaleString()}</b>
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Mín: <b>{s.min.toLocaleString()}</b>
                  </span>
                </div>
              </div>
              {i < STOCK.length - 1 && <div className="h-px bg-gray-100" />}
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 pt-2">
          <button
            onMouseEnter={() => setBtnState("hover")}
            onMouseLeave={() => setBtnState("default")}
            onMouseDown={() => setBtnState("pressed")}
            onMouseUp={() => setBtnState("hover")}
            onClick={() => onRestock()}
            className="w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-200 leading-snug text-center"
            style={{
              backgroundColor: btnBg,
              color: btnTextColor,
              borderColor: G,
              transform: btnState === "pressed" ? "scale(0.98)" : "scale(1)",
              boxShadow: btnState === "hover" ? `0 4px 16px ${G}35` : "none",
            }}
          >
            Generar Orden de
            <br />
            Reabastecimiento
          </button>
        </div>
      </div>

      {detailItem && (
        <StockDetailPopover
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onRestock={(name) => onRestock(name)}
        />
      )}
    </>
  )
}
