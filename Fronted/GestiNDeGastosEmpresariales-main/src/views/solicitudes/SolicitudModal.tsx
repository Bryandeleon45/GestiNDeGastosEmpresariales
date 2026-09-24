import { useState, useRef } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { DEPS_LIST } from "@/models/solicitudes"
import Dropdown from "@/views/common/Dropdown"

export default function SolicitudModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: () => void
}) {
  const [dep, setDep] = useState("Oficina de Agua")
  const [tipo, setTipo] = useState("Compra de Materiales")
  const [item, setItem] = useState("")
  const [cant, setCant] = useState("0")
  const [unidad, setUnidad] = useState("Resma")
  const [just, setJust] = useState("")
  const [notas, setNotas] = useState("")
  const [prio, setPrio] = useState<"Baja" | "Media" | "Alta">("Alta")
  const overlayRef = useRef<HTMLDivElement>(null)
  const TIPOS = [
    "Compra de Materiales",
    "Servicio Técnico",
    "Equipamiento",
    "Mantenimiento",
  ]
  const UNIDS = ["Resma", "Unidad", "Caja", "Paquete"]
  const FI = ({
    label,
    children,
  }: {
    label: string
    children: React.ReactNode
  }) => (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
  const TI = ({
    ph,
    val,
    set,
    type = "text",
  }: {
    ph?: string
    val: string
    set: (v: string) => void
    type?: string
  }) => {
    const [f, setF] = useState(false)
    return (
      <input
        type={type}
        value={val}
        placeholder={ph}
        onChange={(e) => set(e.target.value)}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        className="w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg outline-none transition-all placeholder-gray-400"
        style={{
          borderColor: f ? G : "#E5E7EB",
          boxShadow: f ? `0 0 0 3px ${G}22` : "none",
        }}
      />
    )
  }
  const TA = ({
    ph,
    val,
    set,
  }: {
    ph?: string
    val: string
    set: (v: string) => void
  }) => {
    const [f, setF] = useState(false)
    return (
      <textarea
        value={val}
        placeholder={ph}
        rows={3}
        onChange={(e) => set(e.target.value)}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        className="w-full px-3 py-2.5 text-sm bg-gray-50 border rounded-lg outline-none resize-none transition-all placeholder-gray-400"
        style={{
          borderColor: f ? G : "#E5E7EB",
          boxShadow: f ? `0 0 0 3px ${G}22` : "none",
        }}
      />
    )
  }
  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.52)",
        backdropFilter: "blur(1px)",
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col"
        style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: G }}
            >
              <Icons.ShieldCheck />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Formulario de Solicitud
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            <Icons.X />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Dropdown
              label="Dependencia / Unidad"
              value={dep}
              options={DEPS_LIST}
              onChange={setDep}
            />
            <Dropdown
              label="Tipo de Solicitud"
              value={tipo}
              options={TIPOS}
              onChange={setTipo}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FI label="Nombre del Ítem">
              <TI ph="Ej. Papel Bond Carta" val={item} set={setItem} />
            </FI>
            <div className="grid grid-cols-2 gap-3">
              <FI label="Cantidad">
                <TI ph="0" val={cant} set={setCant} type="number" />
              </FI>
              <Dropdown
                label="Unidad"
                value={unidad}
                options={UNIDS}
                onChange={setUnidad}
              />
            </div>
          </div>
          <FI label="Justificación">
            <TA
              ph="Describe la necesidad institucional..."
              val={just}
              set={setJust}
            />
          </FI>
          <div
            className="flex items-start gap-3 rounded-lg px-4 py-3.5 border"
            style={{ backgroundColor: GL, borderColor: GB }}
          >
            <span style={{ color: G }} className="mt-0.5 shrink-0">
              <Icons.Info />
            </span>
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-0.5"
                style={{ color: G }}
              >
                Presupuesto Asignado
              </p>
              <p className="text-xs text-gray-700">
                Presupuesto restante = <b>Q 5,200</b>
              </p>
            </div>
          </div>
          <FI label="Notas para Aprobación">
            <TA ph="Notas para Aprobación" val={notas} set={setNotas} />
          </FI>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Prioridad
            </label>
            <div className="flex items-center gap-6">
              {(["Baja", "Media", "Alta"] as const).map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => setPrio(p)}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: prio === p ? G : "#D1D5DB",
                      backgroundColor: prio === p ? G : "white",
                    }}
                  >
                    {prio === p && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      prio === p ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {p}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: G }}
          >
            <Icons.CirclePlus />
            Crear Solicitud
          </button>
        </div>
      </div>
    </div>
  )
}
