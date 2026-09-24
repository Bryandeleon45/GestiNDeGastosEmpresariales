import { useState, useEffect, useRef } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { BARRIOS, STATS } from "@/models/jurisdiccion"

export default function JurisdictionModal({
  onClose,
}: {
  onClose: () => void
}) {
  const [visible, setVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])
  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && handleClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{
        backgroundColor: `rgba(0,0,0,${visible ? 0.55 : 0})`,
        backdropFilter: "blur(2px)",
        transition: "background-color 0.28s",
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{
          animation: "modalIn 0.24s cubic-bezier(.16,1,.3,1)",
          maxHeight: "88vh",
        }}
      >
        <div className="relative h-44 shrink-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1650734837693-7169695a7f79?w=800&h=400&fit=crop&auto=format"
            alt="Lago de Atitlán, Panajachel"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.72) 100%)",
            }}
          />
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all"
          >
            <Icons.X />
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-[2px] mb-0.5">
              Jurisdicción Municipal
            </p>
            <h2 className="text-white text-2xl font-extrabold leading-none tracking-tight">
              Panajachel
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <svg
                className="w-3 h-3 text-white/70"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span className="text-white/75 text-xs font-medium">
                Sololá, Guatemala · Lago de Atitlán
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 border-b border-gray-100">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`px-4 py-3.5 ${
                  i < STATS.length - 1 ? "border-r border-gray-100" : ""
                }`}
              >
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {s.label}
                </p>
                <p className="text-sm font-extrabold text-gray-900 mt-0.5">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div
            className="mx-5 my-4 rounded-xl overflow-hidden border border-gray-100 relative"
            style={{ height: 180 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 30%, #93c5fd 60%, #60a5fa 100%)",
              }}
            >
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 400 180"
                preserveAspectRatio="xMidYMid slice"
              >
                <ellipse
                  cx="200"
                  cy="95"
                  rx="155"
                  ry="62"
                  fill="rgba(59,130,246,0.4)"
                  stroke="rgba(29,78,216,0.3)"
                  strokeWidth="1.5"
                />
                <ellipse
                  cx="200"
                  cy="95"
                  rx="110"
                  ry="44"
                  fill="rgba(37,99,235,0.25)"
                />
                <polygon
                  points="90,130 130,50 170,130"
                  fill="rgba(16,185,129,0.6)"
                  stroke="rgba(4,120,87,0.4)"
                  strokeWidth="1"
                />
                <polygon
                  points="220,130 265,45 310,130"
                  fill="rgba(16,185,129,0.55)"
                  stroke="rgba(4,120,87,0.4)"
                  strokeWidth="1"
                />
                <circle
                  cx="200"
                  cy="78"
                  r="7"
                  fill={G}
                  stroke="white"
                  strokeWidth="2"
                />
                <circle cx="200" cy="78" r="3" fill="white" />
                <ellipse
                  cx="200"
                  cy="95"
                  rx="175"
                  ry="78"
                  fill="none"
                  stroke="rgba(99,102,241,0.15)"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
                <ellipse
                  cx="200"
                  cy="95"
                  rx="185"
                  ry="85"
                  fill="none"
                  stroke="rgba(99,102,241,0.10)"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
              </svg>
              <div className="absolute top-2 left-3 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/60">
                <p className="text-[10px] font-bold text-gray-700">
                  Lago de Atitlán
                </p>
              </div>
              <div className="absolute bottom-2 right-3 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/60 flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: G }}
                />
                <p className="text-[10px] font-bold text-gray-700">
                  Panajachel
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Barrios y Aldeas
            </p>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Sector", "Población", "Área", "Tipo"].map((h) => (
                      <th
                        key={h}
                        className="px-3.5 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BARRIOS.map((b, i) => (
                    <tr
                      key={b.name}
                      className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${
                        i % 2 === 1 ? "bg-gray-50/30" : ""
                      }`}
                    >
                      <td className="px-3.5 py-2.5 text-xs font-semibold text-gray-800">
                        {b.name}
                      </td>
                      <td className="px-3.5 py-2.5 text-xs font-mono text-gray-600">
                        {b.pop}
                      </td>
                      <td className="px-3.5 py-2.5 text-xs font-mono text-gray-600">
                        {b.area}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.type === "Rural"
                              ? "bg-amber-50 text-amber-700"
                              : b.type === "Comercial"
                                ? "bg-blue-50 text-blue-700"
                                : b.type === "Mixto"
                                  ? "bg-purple-50 text-purple-700"
                                  : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {b.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            Cerrar
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: G }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Ver en Google Maps
          </button>
        </div>
      </div>
    </div>
  )
}
