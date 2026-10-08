import { useEffect, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  listarInventario,
  crearValeSalida,
  type InsumoInventario,
  type ValeItemInput,
} from "@/api/bodega"
import { listarDependencias, type Dependencia } from "@/api/catalogos"
import { ApiError } from "@/api/client"

interface ItemLinea {
  id_insumo: number
  nombre: string
  unidad: string
  cantidad: number
  stock: number
}

export default function NuevoValeModal({
  onClose,
  onSuccess,
  onToast,
}: {
  onClose: () => void
  onSuccess: () => void
  onToast: (m: string, s: string) => void
}) {
  const [deps, setDeps] = useState<Dependencia[]>([])
  const [insumos, setInsumos] = useState<InsumoInventario[]>([])
  const [idDependencia, setIdDependencia] = useState<number | "">("")
  const [justificacion, setJustificacion] = useState("")
  const [items, setItems] = useState<ItemLinea[]>([])
  const [insumoSel, setInsumoSel] = useState<number | "">("")
  const [cantidad, setCantidad] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listarDependencias()
      .then(setDeps)
      .catch(() => onToast("Error", "No se pudieron cargar las dependencias"))
    listarInventario()
      .then((list) => setInsumos(list.filter((i) => i.stock_actual > 0)))
      .catch(() => onToast("Error", "No se pudo cargar el inventario"))
  }, [])

  const agregar = () => {
    if (insumoSel === "") {
      onToast("Revisar formulario", "Seleccione un insumo")
      return
    }
    const insumo = insumos.find((i) => i.id_insumo === insumoSel)
    if (!insumo) return
    const cant = parseInt(cantidad, 10)
    if (!cant || cant <= 0) {
      onToast("Revisar formulario", "La cantidad debe ser mayor a cero")
      return
    }
    if (cant > insumo.stock_actual) {
      onToast("Stock insuficiente", `Solo hay ${insumo.stock_actual} ${insumo.unidad_simbolo} disponibles`)
      return
    }
    setItems((prev) => {
      const existente = prev.find((x) => x.id_insumo === insumo.id_insumo)
      if (existente) {
        const nueva = existente.cantidad + cant
        if (nueva > existente.stock) {
          onToast("Stock insuficiente", `Solo hay ${existente.stock} ${existente.unidad} disponibles`)
          return prev
        }
        return prev.map((x) => (x.id_insumo === insumo.id_insumo ? { ...x, cantidad: nueva } : x))
      }
      return [
        ...prev,
        { id_insumo: insumo.id_insumo, nombre: insumo.nombre, unidad: insumo.unidad_simbolo, cantidad: cant, stock: insumo.stock_actual },
      ]
    })
    setInsumoSel("")
    setCantidad("")
  }

  const quitar = (id: number) => setItems((prev) => prev.filter((x) => x.id_insumo !== id))

  const crear = async () => {
    if (idDependencia === "") {
      onToast("Revisar formulario", "Seleccione la dependencia")
      return
    }
    if (items.length === 0) {
      onToast("Revisar formulario", "Agregue al menos un insumo")
      return
    }
    setSubmitting(true)
    try {
      const payload: { id_dependencia: number; justificacion?: string; items: ValeItemInput[] } = {
        id_dependencia: Number(idDependencia),
        items: items.map((i) => ({ id_insumo: i.id_insumo, cantidad: i.cantidad })),
      }
      if (justificacion.trim()) payload.justificacion = justificacion.trim()
      await crearValeSalida(payload)
      onToast("Vale creado", "El vale quedó Pendiente de autorización.")
      onSuccess()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo crear el vale")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.52)", backdropFilter: "blur(1px)" }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col"
        style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: G }}>
              <Icons.Doc />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Nuevo Vale de Salida</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
            <Icons.X />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dependencia solicitante</label>
            <select
              value={idDependencia}
              onChange={(e) => setIdDependencia(e.target.value === "" ? "" : Number(e.target.value))}
              className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
            >
              <option value="">Seleccione una dependencia…</option>
              {deps.map((d) => (
                <option key={d.id_dependencia} value={d.id_dependencia}>
                  {d.nombre_dependencia}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Justificación</label>
            <textarea
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              rows={2}
              placeholder="Motivo de la salida…"
              className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Agregar insumos</label>
            <div className="flex gap-2">
              <select
                value={insumoSel}
                onChange={(e) => setInsumoSel(e.target.value === "" ? "" : Number(e.target.value))}
                className="flex-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              >
                <option value="">Seleccione un insumo…</option>
                {insumos.map((i) => (
                  <option key={i.id_insumo} value={i.id_insumo}>
                    {i.nombre} · {i.stock_actual} {i.unidad_simbolo}
                  </option>
                ))}
              </select>
              <input
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                type="number"
                min={1}
                placeholder="Cant."
                className="w-24 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
              <button onClick={agregar} className="px-4 py-2.5 text-sm font-bold text-white rounded-lg" style={{ backgroundColor: G }}>
                <Icons.Plus />
              </button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-50">
              {items.map((it) => (
                <div key={it.id_insumo} className="flex items-center justify-between gap-3 px-4 py-3" style={{ backgroundColor: GL }}>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{it.nombre}</p>
                    <p className="text-xs text-gray-500">{it.cantidad} {it.unidad}</p>
                  </div>
                  <button onClick={() => quitar(it.id_insumo)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                    <Icons.X />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button
            onClick={crear}
            disabled={submitting || items.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
            style={{ backgroundColor: G }}
          >
            <Icons.Plus />
            {submitting ? "Creando…" : "Crear Vale"}
          </button>
        </div>
      </div>
    </div>
  )
}
