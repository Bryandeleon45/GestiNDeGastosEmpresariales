import { useEffect, useMemo, useRef, useState } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import Dropdown from "@/views/common/Dropdown"
import {
  listarDependencias,
  obtenerPresupuestoDependencia,
  type Dependencia,
  type PresupuestoDependencia,
} from "@/api/catalogos"
import {
  listarTiposSolicitud,
  listarUnidadesMedida,
  buscarInsumos,
  crearRequisicion,
  editarRequisicion,
  type UnidadMedida,
  type Insumo,
  type Requisicion,
} from "@/api/requisiciones"
import { ApiError } from "@/api/client"

type Prio = "Baja" | "Media" | "Alta" | "Urgente"

const PRIOS: Prio[] = ["Baja", "Media", "Alta", "Urgente"]

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
  const [insumoId, setInsumoId] = useState<number | null>(
    initial?.items?.[0]?.id_insumo ?? null,
  )
  const [descripcionLibre, setDescripcionLibre] = useState(
    initial?.items?.[0]?.descripcion_libre ?? "",
  )
  const [cantidad, setCantidad] = useState(initial?.items?.[0]?.cantidad ?? "")
  const [unidadId, setUnidadId] = useState<number | null>(
    initial?.items?.[0]?.id_unidad_medida ?? null,
  )
  const [precio, setPrecio] = useState(initial?.items?.[0]?.precio_estimado ?? "")
  const [justificacion, setJustificacion] = useState(initial?.justificacion ?? "")
  const [lugarEntrega, setLugarEntrega] = useState(initial?.lugar_entrega ?? "")
  const [prioridad, setPrioridad] = useState<Prio>(
    (initial?.prioridad as Prio) ?? "Media",
  )
  const [observaciones, setObservaciones] = useState(
    initial?.items?.[0]?.observaciones ?? "",
  )

  const [insumoQuery, setInsumoQuery] = useState(() => {
    const it = initial?.items?.[0]
    if (!it) return ""
    if (it.id_insumo != null && it.insumo_nombre)
      return `${it.insumo_nombre} (${it.codigo_insumo ?? ""})`.trim()
    return it.descripcion_libre ?? ""
  })
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [showInsumos, setShowInsumos] = useState(false)

  const [presupuesto, setPresupuesto] = useState<PresupuestoDependencia | null>(null)
  const [cargandoPresupuesto, setCargandoPresupuesto] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)
  const insumoRef = useRef<HTMLDivElement>(null)

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
  }, [onToast])

  useEffect(() => {
    if (depId == null) {
      setPresupuesto(null)
      return
    }
    setCargandoPresupuesto(true)
    obtenerPresupuestoDependencia(depId)
      .then(setPresupuesto)
      .catch(() => setPresupuesto(null))
      .finally(() => setCargandoPresupuesto(false))
  }, [depId])

  useEffect(() => {
    if (!insumoQuery.trim()) {
      setInsumos([])
      return
    }
    const t = setTimeout(() => {
      buscarInsumos(insumoQuery)
        .then(setInsumos)
        .catch(() => setInsumos([]))
    }, 250)
    return () => clearTimeout(t)
  }, [insumoQuery])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (insumoRef.current && !insumoRef.current.contains(e.target as Node))
        setShowInsumos(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const monto = useMemo(() => {
    const c = parseFloat(cantidad) || 0
    const p = parseFloat(precio) || 0
    return c * p
  }, [cantidad, precio])

  const disponible = useMemo(
    () => (presupuesto ? parseFloat(presupuesto.monto_disponible) : null),
    [presupuesto],
  )
  const excede = disponible !== null && monto > disponible

  const unidadSeleccionada = unidades.find((u) => u.id_unidad_medida === unidadId) ?? null

  const seleccionarInsumo = (insumo: Insumo) => {
    setInsumoId(insumo.id_insumo)
    setDescripcionLibre("")
    setInsumoQuery(`${insumo.nombre} (${insumo.codigo_insumo})`)
    setPrecio(insumo.precio_referencial)
    setUnidadId(insumo.id_unidad_medida)
    setShowInsumos(false)
  }

  const limpiarInsumo = () => {
    setInsumoId(null)
    setInsumoQuery("")
    setDescripcionLibre("")
    setShowInsumos(false)
  }

  const validar = (): string | null => {
    if (depId == null) return "Seleccione la dependencia"
    if (!justificacion.trim()) return "La justificación es obligatoria"
    if (!(parseFloat(cantidad) > 0)) return "La cantidad debe ser mayor que 0"
    if (unidadId == null) return "Seleccione la unidad de medida"
    if (insumoId == null && !descripcionLibre.trim())
      return "Seleccione un ítem del catálogo o escriba una descripción"
    if (excede) return "El monto excede el presupuesto disponible"
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
      const items = [
        {
          id_insumo: insumoId,
          descripcion_libre: descripcionLibre.trim() || null,
          id_unidad_medida: unidadId as number,
          cantidad: parseFloat(cantidad),
          precio_estimado: parseFloat(precio) || 0,
          observaciones: observaciones.trim() || null,
        },
      ]
      if (initial) {
        await editarRequisicion(initial.id_requisicion, {
          tipo_solicitud: tipo,
          justificacion: justificacion.trim(),
          lugar_entrega: lugarEntrega.trim() || undefined,
          prioridad,
          items,
        })
        onToast("Solicitud actualizada", "Los cambios fueron guardados.")
      } else {
        await crearRequisicion({
          id_dependencia: depId ?? undefined,
          tipo_solicitud: tipo,
          justificacion: justificacion.trim(),
          lugar_entrega: lugarEntrega.trim() || undefined,
          prioridad,
          items,
        })
        onToast("Solicitud creada exitosamente", "La requisición fue enviada para revisión.")
      }
      onSuccess()
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 422
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

          <div className="grid grid-cols-2 gap-4">
            <Field label="Ítem">
              <div ref={insumoRef} className="relative">
                {insumoId == null ? (
                  <input
                    value={insumoQuery}
                    placeholder="Buscar en catálogo o escribir descripción libre…"
                    onChange={(e) => {
                      setInsumoQuery(e.target.value)
                      setDescripcionLibre(e.target.value)
                      setShowInsumos(true)
                    }}
                    onFocus={() => setShowInsumos(true)}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 transition-all placeholder-gray-400"
                  />
                ) : (
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-800 font-medium truncate">
                      {insumoQuery}
                    </span>
                    <button
                      type="button"
                      onClick={limpiarInsumo}
                      className="text-gray-400 hover:text-gray-700 shrink-0"
                    >
                      <Icons.X />
                    </button>
                  </div>
                )}
                {showInsumos && insumoId == null && insumos.length > 0 && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[300] overflow-hidden max-h-48 overflow-y-auto"
                    style={{ animation: "dropIn 0.13s ease-out" }}
                  >
                    {insumos.map((ins) => (
                      <button
                        type="button"
                        key={ins.id_insumo}
                        onClick={() => seleccionarInsumo(ins)}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {ins.nombre}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {ins.codigo_insumo} · Q{" "}
                          {Number(ins.precio_referencial).toLocaleString("es-GT", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cantidad">
                <TextInput ph="0" val={cantidad} set={setCantidad} type="number" />
              </Field>
              <ObjectSelect
                label="Unidad"
                value={unidadSeleccionada}
                options={unidades}
                getLabel={(u) => `${u.nombre} (${u.simbolo || "—"})`}
                getId={(u) => u.id_unidad_medida}
                onChange={(u) => setUnidadId(u ? u.id_unidad_medida : null)}
                placeholder="Unidad"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio Estimado (Q)">
              <TextInput ph="0.00" val={precio} set={setPrecio} type="number" />
            </Field>
            <Field label="Lugar de Entrega">
              <TextInput ph="Ej. Bodega Central" val={lugarEntrega} set={setLugarEntrega} />
            </Field>
          </div>

          <Field label="Justificación">
            <TextArea
              ph="Describe la necesidad institucional..."
              val={justificacion}
              set={setJustificacion}
            />
          </Field>

          <div
            className="flex items-start gap-3 rounded-lg px-4 py-3.5 border"
            style={{
              backgroundColor: excede ? "#FEF2F2" : GL,
              borderColor: excede ? "#FECACA" : GB,
            }}
          >
            <span
              style={{ color: excede ? "#DC2626" : G }}
              className="mt-0.5 shrink-0"
            >
              {excede ? <Icons.Warning /> : <Icons.Info />}
            </span>
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-0.5"
                style={{ color: excede ? "#DC2626" : G }}
              >
                Presupuesto Restante
              </p>
              {cargandoPresupuesto ? (
                <p className="text-xs text-gray-600">Consultando presupuesto…</p>
              ) : presupuesto ? (
                <>
                  <p className="text-xs text-gray-700">
                    Presupuesto restante ={" "}
                    <b>
                      Q{" "}
                      {Number(presupuesto.monto_disponible).toLocaleString("es-GT", {
                        minimumFractionDigits: 2,
                      })}
                    </b>
                  </p>
                  <p className="text-xs text-gray-700">
                    Monto de esta solicitud ={" "}
                    <b>
                      Q{" "}
                      {monto.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                    </b>
                  </p>
                  {excede && (
                    <p className="text-xs font-semibold text-red-600 mt-0.5">
                      El monto supera el saldo disponible.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-600">
                  Sin presupuesto para el período activo.
                </p>
              )}
            </div>
          </div>

          <Field label="Observaciones / Notas para Aprobación">
            <TextArea
              ph="Notas para aprobación"
              val={observaciones}
              set={setObservaciones}
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
            disabled={submitting || excede}
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
