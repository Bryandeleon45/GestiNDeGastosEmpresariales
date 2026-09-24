import { useState, useEffect } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"

type Priority = "Baja" | "Media" | "Alta" | "Urgente"
type Category = "Técnico" | "Presupuesto" | "Solicitudes" | "Acceso" | "Otro"

export default function SupportTicketDrawer({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: () => void
}) {
  const [asunto, setAsunto] = useState("")
  const [categoria, setCategoria] = useState<Category>("Técnico")
  const [prioridad, setPrioridad] = useState<Priority>("Media")
  const [desc, setDesc] = useState("")
  const [nombre, setNombre] = useState("Lic. Ricardo Gómez")
  const [email, setEmail] = useState("rgomez@munipanajachel.gob.gt")
  const [visible, setVisible] = useState(false)
  const [focusField, setFocus] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 320)
  }

  const CATS: Category[] = [
    "Técnico",
    "Presupuesto",
    "Solicitudes",
    "Acceso",
    "Otro",
  ]
  const PRIOS: Priority[] = ["Baja", "Media", "Alta", "Urgente"]
  const PRIO_COLOR: Record<Priority, string> = {
    Baja: "bg-gray-100 text-gray-600",
    Media: "bg-amber-50 text-amber-700",
    Alta: "bg-orange-50 text-orange-600",
    Urgente: "bg-red-50 text-red-600",
  }

  const fi = (id: string) => ({
    onFocus: () => setFocus(id),
    onBlur: () => setFocus(null),
    style: {
      borderColor: focusField === id ? G : "#E5E7EB",
      boxShadow: focusField === id ? `0 0 0 3px ${G}20` : "none",
      outline: "none",
      transition: "all 0.15s",
    },
  })

  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.4 : 0})`,
          backdropFilter: "blur(1px)",
          transition: "background-color 0.32s",
        }}
      />

      <div
        className="fixed right-0 top-0 bottom-0 z-[210] flex flex-col bg-white shadow-2xl"
        style={{
          width: 440,
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: G }}
            >
              <Icons.Headset />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-none">
                Abrir Ticket de Soporte
              </h2>
              <p
                className="text-xs font-semibold mt-0.5 uppercase tracking-wider"
                style={{ color: G }}
              >
                Centro de Soporte DAFIM
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            <Icons.X />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Información del Solicitante
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2.5">
                <Icons.User />
                <span className="text-sm font-semibold text-gray-800">
                  {nombre}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-500">
                <Icons.Send />
                <span className="text-sm">{email}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              Asunto del Ticket
            </label>
            <input
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej. Error al generar reporte PDF..."
              className="w-full px-3 py-2.5 text-sm bg-white border rounded-lg placeholder-gray-400"
              {...fi("asunto")}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Categoría
            </label>
            <div className="flex flex-wrap gap-2">
              {CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={
                    categoria === c
                      ? { backgroundColor: G, color: "white", borderColor: G }
                      : {
                          backgroundColor: "white",
                          color: "#374151",
                          borderColor: "#E5E7EB",
                        }
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Prioridad
            </label>
            <div className="flex gap-2">
              {PRIOS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrioridad(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${PRIO_COLOR[p]}`}
                  style={
                    prioridad === p
                      ? {
                          borderColor: G,
                          outline: `2px solid ${G}`,
                          outlineOffset: 2,
                        }
                      : { borderColor: "#E5E7EB" }
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              Descripción Detallada
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder="Describe el problema o consulta con el mayor detalle posible..."
              className="w-full px-3 py-2.5 text-sm bg-white border rounded-lg placeholder-gray-400 resize-none"
              {...fi("desc")}
            />
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Icons.FileText />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700">
                Adjuntar captura o archivo
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                PNG, PDF hasta 5 MB
              </p>
            </div>
            <button
              className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:bg-gray-100"
              style={{ color: G, borderColor: GB }}
            >
              Subir
            </button>
          </div>

          <div
            className="flex items-start gap-2.5 rounded-xl px-4 py-3 border"
            style={{ backgroundColor: GL, borderColor: GB }}
          >
            <span style={{ color: G }} className="mt-0.5 shrink-0">
              <Icons.Info />
            </span>
            <p className="text-xs text-gray-700 leading-relaxed">
              El equipo de soporte <strong>DAFIM</strong> responde en un máximo
              de <strong>4 horas hábiles</strong>. Tickets urgentes tienen
              respuesta en 1 hora.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: G }}
          >
            <Icons.Send />
            Enviar Ticket
          </button>
        </div>
      </div>
    </>
  )
}
