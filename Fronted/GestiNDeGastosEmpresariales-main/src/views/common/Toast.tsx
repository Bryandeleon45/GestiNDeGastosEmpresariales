import { useEffect } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"

export default function Toast({
  show,
  message,
  sub,
  onHide,
}: {
  show: boolean
  message: string
  sub?: string
  onHide: () => void
}) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onHide, 4500)
      return () => clearTimeout(t)
    }
  }, [show, onHide])
  return (
    <div
      className={`fixed top-5 right-5 z-[500] transition-all duration-300 ${
        show
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-3 pointer-events-none"
      }`}
    >
      <div className="flex items-start gap-3 bg-white border border-gray-200 shadow-2xl rounded-xl px-5 py-4 max-w-sm">
        <span style={{ color: G }} className="mt-0.5 shrink-0">
          <Icons.CheckCircle />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{message}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <button
          onClick={onHide}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        >
          <Icons.X />
        </button>
      </div>
    </div>
  )
}
