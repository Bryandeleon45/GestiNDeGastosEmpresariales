import { useState } from "react"

export default function BrandingCard({ onOpenMap }: { onOpenMap: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onOpenMap}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden cursor-pointer"
      style={{
        borderRadius: 16,
        height: 140,
        boxShadow: hovered
          ? "0 10px 30px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10)"
          : "0 2px 8px rgba(0,0,0,0.08)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.22s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: 16 }}
      >
        <img
          src="https://images.unsplash.com/photo-1650734837693-7169695a7f79?w=640&h=320&fit=crop&auto=format"
          alt="Lago de Atitlán, Panajachel, Guatemala"
          className="w-full h-full object-cover"
          style={{
            transform: hovered ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
            transformOrigin: "center center",
          }}
        />
      </div>

      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.68) 100%)",
          opacity: hovered ? 0.95 : 0.85,
        }}
      />

      <div
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200"
        style={{
          backgroundColor: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.30)",
          opacity: hovered ? 1 : 0,
          transform: hovered
            ? "translateY(0) scale(1)"
            : "translateY(-4px) scale(0.95)",
        }}
      >
        <svg
          className="w-3 h-3 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        <span className="text-[10px] font-bold text-white whitespace-nowrap">
          Ver mapa
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
        <p className="text-white/55 text-[9px] font-bold uppercase tracking-[1.8px] mb-0.5 leading-none">
          Jurisdicción Actual
        </p>
        <p className="text-white text-[22px] font-extrabold leading-none tracking-tight mb-1.5">
          Panajachel
        </p>
        <div className="flex items-center gap-1">
          <svg
            className="w-3 h-3 shrink-0"
            fill="rgba(203,213,225,0.9)"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="text-[#CBD5E1] text-[13px] font-normal leading-none">
            Sololá, Guatemala
          </span>
        </div>
      </div>
    </div>
  )
}
