import { useEffect, useRef, useState } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import Dropdown from "@/views/common/Dropdown"
import { listarDependencias, type Dependencia } from "@/api/catalogos"
import {
  listarTiposSolicitud,
  listarUnidadesMedida,
  buscarInsumos,
  crearRequisicion,
  editarRequisicion,
  obtenerPeriodoActivo,
  subirImagenesRequisicion,
  type UnidadMedida,
  type Insumo,
  type Requisicion,
} from "@/api/requisiciones"
import { ApiError } from "@/api/client"

type Prio = "Baja" | "Media" | "Alta" | "Urgente"

const PRIOS: Prio[] = ["Baja", "Media", "Alta", "Urgente"]

interface ItemDraft {
  key: number
  id_insumo: number | null
  descripcion_libre: string
  cantidad: string
  id_unidad_medida: number | null
  insumoQuery: string
  insumoNombre: string
  insumoCodigo: string
  showDropdown: boolean
}

let nextKey = 1

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function ObjectSelect<T>({
  label,
  value,
  options,
  getLabel,
  getId,
  onChange,
  placeholder,
}: {
  label: string
  value: T | null
  options: T[]
  getLabel: (o: T) => string
  getId: (o: T) => string | number
  onChange: (v: T | null) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])
  return (
    <div ref={ref} className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-white border rounded-lg outline-none transition-all text-left"
          style={{
            borderColor: open ? G : "#D1D5DB",
            boxShadow: open ? `0 0 0 3px ${G}22` : "none",
          }}
        >
          <span
            className={`font-medium ${value === null ? "text-gray-400" : "text-gray-800"}`}
          >
            {value === null ? placeholder || "Seleccionar…" : getLabel(value)}
          </span>
          <span className="text-gray-400 ml-2 shrink-0">
            {open ? <Icons.ChevUp /> : <Icons.ChevDown />}
          </span>
        </button>
        {open && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[300] overflow-hidden max-h-56 overflow-y-auto"
            style={{ animation: "dropIn 0.13s ease-out" }}
          >
            {options.length === 0 && (
              <p className="px-3 py-2.5 text-sm text-gray-400">
                Sin opciones disponibles
              </p>
            )}
            {options.map((opt) => (
              <button
                type="button"
                key={getId(opt)}
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors hover:bg-gray-50"
                style={{
                  backgroundColor: value !== null && getId(opt) === getId(value) ? GL : undefined,
                  color: value !== null && getId(opt) === getId(value) ? G : "#374151",
                }}
              >
                <span className="font-medium">{getLabel(opt)}</span>
                {value !== null && getId(opt) === getId(value) && (
                  <span style={{ color: G }}>
                    <Icons.CheckMark />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function TextInput({
  ph,
  val,
  set,
  type = "text",
}: {
  ph?: string
  val: string
  set: (v: string) => void
  type?: string
}) {
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

function TextArea({
  ph,
  val,
  set,
}: {
  ph?: string
  val: string
  set: (v: string) => void
}) {
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

function ItemRow({
  item,
  index,
  unidades,
  insumos,
  onUpdate,
  onRemove,
  onSelectInsumo,
  onClearInsumo,
  onQueryChange,
  onDropdownToggle,
}: {
  item: ItemDraft
  index: number
  unidades: UnidadMedida[]
  insumos: Insumo[]
  onUpdate: (key: number, patch: Partial<ItemDraft>) => void
  onRemove: (key: number) => void
  onSelectInsumo: (key: number, insumo: Insumo) => void
  onClearInsumo: (key: number) => void
  onQueryChange: (key: number, q: string) => void
  onDropdownToggle: (key: number, show: boolean) => void
}) {
  const unidadSel = unidades.find((u) => u.id_unidad_medida === item.id_unidad_medida) ?? null

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Ítem {index + 1}
        </span>
        <button
          type="button"
          onClick={() => onRemove(item.key)}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Icons.X />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ítem">
          <div className="relative">
            {item.id_insumo == null ? (
              <input
                value={item.insumoQuery}
                placeholder="Buscar en catálogo o escribir descripción libre…"
                onChange={(e) => onQueryChange(item.key, e.target.value)}
                onFocus={() => onDropdownToggle(item.key, true)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 transition-all placeholder-gray-400"
              />
            ) : (
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-gray-800 font-medium truncate">
                  {item.insumoNombre}
                </span>
                <button
                  type="button"
                  onClick={() => onClearInsumo(item.key)}
                  className="text-gray-400 hover:text-gray-700 shrink-0"
                >
                  <Icons.X />
                </button>
              </div>
            )}
            {item.showDropdown && item.id_insumo == null && insumos.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[300] overflow-hidden max-h-48 overflow-y-auto"
                style={{ animation: "dropIn 0.13s ease-out" }}
              >
                {insumos.map((ins) => (
                  <button
                    type="button"
                    key={ins.id_insumo}
                    onClick={() => onSelectInsumo(item.key, ins)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {ins.nombre}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {ins.codigo_insumo}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad">
            <TextInput
              ph="0"
              val={item.cantidad}
              set={(v) => onUpdate(item.key, { cantidad: v })}
              type="number"
            />
          </Field>
          <ObjectSelect
            label="Unidad"
            value={unidadSel}
            options={unidades}
            getLabel={(u) => `${u.nombre} (${u.simbolo || "—"})`}
            getId={(u) => u.id_unidad_medida}
            onChange={(u) => onUpdate(item.key, { id_unidad_medida: u ? u.id_unidad_medida : null })}
            placeholder="Unidad"
          />
        </div>
      </div>
    </div>
  )
}

export default function SolicitudModal({
  onClose,
  onSuccess,
  onToast,
  initial,
}: {
  onClose: () => void
  onSuccess: () => void
  onToast: (m: string, s: string) => void
  initial?: Requisicion | null
}) {
  const [deps, setDeps] = useState<Dependencia[]>([])
  const [tipos, setTipos] = useState<string[]>([])
  const [unidades, setUnidades] = useState<UnidadMedida[]>([])

  const [depId, setDepId] = useState<number | null>(initial?.id_dependencia ?? null)
  const [tipo, setTipo] = useState(initial?.tipo_solicitud ?? "Compra de Materiales")
  const [justificacion, setJustificacion] = useState(initial?.justificacion ?? "")
  const [lugarEntrega, setLugarEntrega] = useState(initial?.lugar_entrega ?? "")
  const [prioridad, setPrioridad] = useState<Prio>(
    (initial?.prioridad as Prio) ?? "Media",
  )

  const [items, setItems] = useState<ItemDraft[]>(() => {
    if (initial?.items && initial.items.length > 0) {
      return initial.items.map((it) => ({
        key: nextKey++,
        id_insumo: it.id_insumo ?? null,
        descripcion_libre: it.descripcion_libre ?? "",
        cantidad: String(it.cantidad ?? ""),
        id_unidad_medida: it.id_unidad_medida ?? null,
        insumoQuery: it.insumo_nombre
          ? `${it.insumo_nombre} (${it.codigo_insumo ?? ""})`.trim()
          : (it.descripcion_libre ?? ""),
        insumoNombre: it.insumo_nombre ?? "",
        insumoCodigo: it.codigo_insumo ?? "",
        showDropdown: false,
      }))
    }
    return [{
      key: nextKey++,
      id_insumo: null,
      descripcion_libre: "",
      cantidad: "",
      id_unidad_medida: null,
      insumoQuery: "",
      insumoNombre: "",
      insumoCodigo: "",
      showDropdown: false,
    }]
  })

  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [imagenes, setImagenes] = useState<{ file: File; preview: string }[]>([])
  const [periodoActivo, setPeriodoActivo] = useState<boolean | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listarDependencias()
      .then((d) => setDeps(d.filter((x) => x.activo)))
      .catch(() => onToast("Error", "No se pudieron cargar las dependencias"))
    listarTiposSolicitud()
      .then(setTipos)
      .catch(() => {})
    listarUnidadesMedida()
      .then(setUnidades)
      .catch(() => {})
    obtenerPeriodoActivo()
      .then((d) => setPeriodoActivo(d.activo))
      .catch(() => setPeriodoActivo(null))
  }, [onToast])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setItems((prev) => prev.map((it) => ({ ...it, showDropdown: false })))
      }
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const updateItem = (key: number, patch: Partial<ItemDraft>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  }

  const removeItem = (key: number) => {
    setItems((prev) => prev.filter((it) => it.key !== key))
  }

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        key: nextKey++,
        id_insumo: null,
        descripcion_libre: "",
        cantidad: "",
        id_unidad_medida: null,
        insumoQuery: "",
        insumoNombre: "",
        insumoCodigo: "",
        showDropdown: false,
      },
    ])
  }

  const handleQueryChange = (key: number, q: string) => {
    updateItem(key, {
      insumoQuery: q,
      descripcion_libre: q,
      id_insumo: null,
      insumoNombre: "",
      insumoCodigo: "",
    })
    if (!q.trim()) {
      setInsumos([])
      return
    }
    const t = setTimeout(() => {
      buscarInsumos(q)
        .then(setInsumos)
        .catch(() => setInsumos([]))
    }, 250)
    return () => clearTimeout(t)
  }

  const handleSelectInsumo = (key: number, insumo: Insumo) => {
    updateItem(key, {
      id_insumo: insumo.id_insumo,
      descripcion_libre: "",
      insumoQuery: `${insumo.nombre} (${insumo.codigo_insumo})`,
      insumoNombre: insumo.nombre,
      insumoCodigo: insumo.codigo_insumo,
      id_unidad_medida: insumo.id_unidad_medida,
      showDropdown: false,
    })
    setInsumos([])
  }

  const handleClearInsumo = (key: number) => {
    updateItem(key, {
      id_insumo: null,
      insumoQuery: "",
      insumoNombre: "",
      insumoCodigo: "",
      showDropdown: false,
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newImages: { file: File; preview: string }[] = []
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file)
        newImages.push({ file, preview })
      }
    })
    setImagenes((prev) => [...prev, ...newImages])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeImage = (index: number) => {
    setImagenes((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].preview)
      next.splice(index, 1)
      return next
    })
  }

  const validar = (): string | null => {
    if (depId == null) return "Seleccione la dependencia"
    if (!justificacion.trim()) return "La justificación es obligatoria"
    if (items.length === 0) return "Agregue al menos un ítem"
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!(parseFloat(it.cantidad) > 0))
        return `Ítem ${i + 1}: La cantidad debe ser mayor que 0`
      if (it.id_unidad_medida == null)
        return `Ítem ${i + 1}: Seleccione la unidad de medida`
      if (it.id_insumo == null && !it.descripcion_libre.trim())
        return `Ítem ${i + 1}: Seleccione un ítem del catálogo o escriba una descripción`
    }
    return null
  }

  const enviar = async () => {
    const err = validar()
    if (err) {
      onToast("Revisar formulario", err)
      return
    }
    setSubmitting(true)
    try {
      const payloadItems = items.map((it) => ({
        id_insumo: it.id_insumo,
        descripcion_libre: it.descripcion_libre.trim() || null,
        id_unidad_medida: it.id_unidad_medida as number,
        cantidad: parseFloat(it.cantidad),
      }))
      let idCreada: number | null = null
      if (initial) {
        await editarRequisicion(initial.id_requisicion, {
          tipo_solicitud: tipo,
          justificacion: justificacion.trim(),
          lugar_entrega: lugarEntrega.trim() || undefined,
          prioridad,
          items: payloadItems,
        })
        idCreada = initial.id_requisicion
        onToast("Solicitud actualizada", "Los cambios fueron guardados.")
      } else {
        const creada = await crearRequisicion({
          id_dependencia: depId ?? undefined,
          tipo_solicitud: tipo,
          justificacion: justificacion.trim(),
          lugar_entrega: lugarEntrega.trim() || undefined,
          prioridad,
          items: payloadItems,
        })
        idCreada = creada.id_requisicion
        onToast("Solicitud creada exitosamente", "La requisición fue enviada para revisión.")
      }
      if (idCreada != null && imagenes.length > 0) {
        const subidas = await Promise.all(
          imagenes.map((img) =>
            fileToBase64(img.file).then((contenido_base64) => ({
              nombre_archivo: img.file.name,
              mime_type: img.file.type || "image/jpeg",
              contenido_base64,
            })),
          ),
        )
        await subirImagenesRequisicion(idCreada, subidas)
      }
      onSuccess()
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo guardar la solicitud"
      onToast("Error", msg)
    } finally {
      setSubmitting(false)
    }
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
              {initial ? "Editar Solicitud" : "Formulario de Solicitud"}
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
          {periodoActivo === false && (
            <div className="flex items-start gap-3 rounded-lg px-4 py-3 border bg-red-50 border-red-200">
              <span className="text-red-500 mt-0.5 shrink-0">
                <Icons.Warning />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-0.5">
                  Período Fiscal Inactivo
                </p>
                <p className="text-xs text-red-700">
                  No hay un período fiscal activo. No se pueden crear solicitudes hasta que se active un período.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <ObjectSelect
              label="Dependencia / Unidad"
              value={deps.find((d) => d.id_dependencia === depId) ?? null}
              options={deps}
              getLabel={(d) => d.nombre_dependencia}
              getId={(d) => d.id_dependencia}
              onChange={(d) => setDepId(d ? d.id_dependencia : null)}
              placeholder="Seleccione dependencia"
            />
            <Dropdown
              label="Tipo de Solicitud"
              value={tipo}
              options={tipos.length ? tipos : ["Compra de Materiales"]}
              onChange={setTipo}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Ítems de la Solicitud
              </span>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: G }}
              >
                <Icons.CirclePlus />
                Agregar Ítem
              </button>
            </div>

            {items.map((item, idx) => (
              <ItemRow
                key={item.key}
                item={item}
                index={idx}
                unidades={unidades}
                insumos={insumos}
                onUpdate={updateItem}
                onRemove={removeItem}
                onSelectInsumo={handleSelectInsumo}
                onClearInsumo={handleClearInsumo}
                onQueryChange={handleQueryChange}
                onDropdownToggle={(key, show) => updateItem(key, { showDropdown: show })}
              />
            ))}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              Solicitudes Autorizadas (Imágenes)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: G }}
                >
                  <Icons.CirclePlus />
                </div>
                <p className="text-sm text-gray-600">
                  Click para subir imágenes de solicitudes autorizadas
                </p>
                <p className="text-xs text-gray-400">
                  PNG, JPG, JPEG (máx. 5MB cada una)
                </p>
              </label>
            </div>
            {imagenes.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {imagenes.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Solicitud ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icons.X />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Field label="Lugar de Entrega">
            <TextInput ph="Ej. Bodega Central" val={lugarEntrega} set={setLugarEntrega} />
          </Field>

          <Field label="Justificación">
            <TextArea
              ph="Describe la necesidad institucional..."
              val={justificacion}
              set={setJustificacion}
            />
          </Field>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Prioridad
            </label>
            <div className="flex items-center gap-6">
              {PRIOS.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => setPrioridad(p)}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: prioridad === p ? G : "#D1D5DB",
                      backgroundColor: prioridad === p ? G : "white",
                    }}
                  >
                    {prioridad === p && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      prioridad === p ? "text-gray-900" : "text-gray-500"
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
            onClick={enviar}
            disabled={submitting || periodoActivo === false}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: G }}
          >
            <Icons.CirclePlus />
            {submitting
              ? "Guardando…"
              : initial
                ? "Guardar Cambios"
                : "Crear Solicitud"}
          </button>
        </div>
      </div>
    </div>
  )
}
