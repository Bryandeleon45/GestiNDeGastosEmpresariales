import { useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"

export default function SupportCard({
  onOpenTicket,
}: {
  onOpenTicket: () => void
}) {
  const [state, setState] = useState<"default" | "hover" | "pressed">("default")

  const shadowMap = {
    default: "0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px #E5E7EB",
    hover: "0 8px 24px rgba(30,94,47,0.12), 0 0 0 1px #C6E0CC",
    pressed: "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px #E5E7EB",
  }
  const bgMap = {
    default: "#FFFFFF",
    hover: "#FFFFFF",
    pressed: "#F9FAFB",
  }
  const translateMap = {
    default: "translateY(0px) scale(1)",
    hover: "translateY(-2px) scale(1)",
    pressed: "translateY(0px) scale(0.98)",
  }

  return (
    <div
      onMouseEnter={() => setState("hover")}
      onMouseLeave={() => setState("default")}
      onMouseDown={() => setState("pressed")}
      onMouseUp={() => setState("hover")}
      style={{
        background: bgMap[state],
        boxShadow: shadowMap[state],
        borderRadius: 16,
        padding: 20,
        transform: translateMap[state],
        transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
        cursor: "default",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
          style={{ backgroundColor: state === "hover" ? "#D1EAD9" : GL }}
        >
          <svg
            className="w-6 h-6 transition-colors duration-200"
            fill="none"
            stroke={G}
            viewBox="0 0 24 24"
            strokeWidth={1.7}
          >
            <path d="M3 18v-6a9 9 0 0118 0v6" />
            <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z" />
            <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
          </svg>
        </div>
        <p className="text-base font-bold text-gray-900 leading-snug">
          ¿Necesitas ayuda?
        </p>
      </div>

      <p className="text-sm text-gray-500 leading-relaxed mb-3">
        Soporte técnico de DAFIM disponible.
      </p>

      <button
        onClick={onOpenTicket}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 group"
        style={{ color: state === "hover" ? "#28A745" : G }}
      >
        <span
          className={state === "hover" ? "underline underline-offset-2" : ""}
        >
          Abrir Ticket
        </span>
        <span
          className="transition-transform duration-200"
          style={{
            transform: state === "hover" ? "translateX(3px)" : "translateX(0)",
          }}
        >
          <Icons.ArrowRight />
        </span>
      </button>
    </div>
  )
}
