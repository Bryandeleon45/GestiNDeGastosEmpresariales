import { G } from "@/constants/theme"

export default function ToggleSwitch({
  on,
  onChange,
}: {
  on: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 focus:outline-none"
      style={{ backgroundColor: on ? G : "#D1D5DB" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300"
        style={{ transform: on ? "translateX(24px)" : "translateX(0)" }}
      />
    </button>
  )
}
