import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import type { StockItem } from "@/models/dashboard"

export default function StockDetailPopover({
  item,
  onClose,
  onRestock,
}: {
  item: StockItem
  onClose: () => void
  onRestock: (name: string) => void
}) {
  const isCrit = item.level === "CRÍTICO"
  const barColor = isCrit ? "#EF4444" : "#F59E0B"
  const badgeStyle = isCrit
    ? { color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA" }
    : { color: "#D97706", background: "#FFFBEB", border: "1px solid #FDE68A" }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(1px)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ animation: "modalIn 0.2s cubic-bezier(.16,1,.3,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  {item.name}
                </h3>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={badgeStyle}
                >
                  {item.level}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{item.location}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all shrink-0"
            >
              <Icons.X />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#F3F4F6"
                  strokeWidth="6"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke={barColor}
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - item.pct / 100)}`}
                  strokeLinecap="round"
                  style={{
                    transition:
                      "stroke-dashoffset 0.6s cubic-bezier(.16,1,.3,1)",
                  }}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-sm font-extrabold"
                style={{ color: barColor }}
              >
                {item.pct}%
              </span>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Disponible</span>
                <span className="text-sm font-bold text-gray-900">
                  {item.disp.toLocaleString()} {item.unit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Mínimo</span>
                <span className="text-sm font-bold text-gray-900">
                  {item.min.toLocaleString()} {item.unit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Déficit</span>
                <span className="text-sm font-bold text-red-600">
                  −{(item.min - item.disp).toLocaleString()} {item.unit}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
            {[
              {
                icon: <Icons.HistoryClock />,
                label: "Último reabastecimiento",
                val: item.lastRestock,
              },
              {
                icon: <Icons.Proveedores />,
                label: "Proveedor",
                val: item.proveedor,
              },
              {
                icon: <Icons.Wallet />,
                label: "Costo unitario",
                val: item.costo,
              },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2.5">
                <span className="text-gray-400 shrink-0">{r.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    {r.label}
                  </p>
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {r.val}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Nivel de Stock
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-red-500">
                <Icons.TrendDown /> Tendencia baja
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${item.pct}%`, backgroundColor: barColor }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">0%</span>
              <span className="text-[10px] text-gray-400">100%</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              onRestock(item.name)
              onClose()
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-sm"
            style={{ backgroundColor: G }}
          >
            <Icons.PackagePlus /> Reabastecer
          </button>
        </div>
      </div>
    </div>
  )
}
