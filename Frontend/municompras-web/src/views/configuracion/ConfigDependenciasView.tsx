import { useEffect, useRef, useState } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  listarDependencias,
  crearDependencia,
  editarDependencia,
  cambiarEstadoDependencia,
  obtenerPresupuestoDependencia,
  actualizarPresupuestoDependencia,
  type Dependencia,
  type PresupuestoDependencia,
} from "@/api/catalogos"
import { ApiError } from "@/api/client"

const fmtQ = (n: number | string | null | undefined) =>
  `Q ${Number(n ?? 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; dep: Dependencia }
  | { mode: "presupuesto"; dep: Dependencia }
  | null

function FieldInput({
  label,
  val,
  set,
  ph,
}: {
  label: string
  val: string
  set: (v: string) => void
  ph?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <input
        value={val}
        placeholder={ph}
        onChange={(e) => set(e.target.value)}
        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 transition-colors"
      />
    </div>
  )
}

export default function ConfigDependenciasView({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const [deps, setDeps] = useState<Dependencia[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>(null)
  const [nombre, setNombre] = useState("")
  const [siglas, setSiglas] = useState("")
  const [ubicacion, setUbicacion] = useState("")
  const [presupuesto, setPresupuesto] = useState<PresupuestoDependencia | null>(null)
  const [cargandoPresupuesto, setCargandoPresupuesto] = useState(false)
  const [montoNuevo, setMontoNuevo] = useState("")
  const [saving, setSaving] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const cargar = async () => {
    setLoading(true)
    try {
      const data = await listarDependencias()
      setDeps(data)
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudieron cargar las dependencias")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const abrirCreate = () => {
    setNombre("")
    setSiglas("")
    setUbicacion("")
    setModal({ mode: "create" })
  }

  const abrirEdit = (dep: Dependencia) => {
    setNombre(dep.nombre_dependencia)
    setSiglas(dep.siglas ?? "")
    setUbicacion(dep.ubicacion ?? "")
    setModal({ mode: "edit", dep })
  }

  const abrirPresupuesto = async (dep: Dependencia) => {
    setModal({ mode: "presupuesto", dep })
    setCargandoPresupuesto(true)
    setPresupuesto(null)
    try {
      const p = await obtenerPresupuestoDependencia(dep.id_dependencia)
      setPresupuesto(p)
      setMontoNuevo(p.monto_asignado)
    } catch {
      setPresupuesto(null)
      setMontoNuevo("")
    } finally {
      setCargandoPresupuesto(false)
    }
  }

  const guardar = async () => {
    if (!nombre.trim()) {
      onToast("Revisar formulario", "El nombre de la dependencia es obligatorio")
      return
    }
    setSaving(true)
    try {
      if (modal?.mode === "edit") {
        await editarDependencia(modal.dep.id_dependencia, {
          nombre_dependencia: nombre.trim(),
          siglas: siglas.trim() || undefined,
          ubicacion: ubicacion.trim() || undefined,
        })
        onToast("Dependencia actualizada", "Los cambios fueron guardados.")
      } else {
        await crearDependencia({
          nombre_dependencia: nombre.trim(),
          siglas: siglas.trim() || undefined,
          ubicacion: ubicacion.trim() || undefined,
        })
        onToast("Dependencia creada", `${nombre.trim()} fue agregada al catálogo.`)
      }
      setModal(null)
      cargar()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : e instanceof Error ? e.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  const guardarPresupuesto = async () => {
    if (!modal || modal.mode !== "presupuesto") return
    const m = parseFloat(montoNuevo)
    if (isNaN(m) || m < 0) {
      onToast("Revisar formulario", "Ingrese un monto válido mayor o igual a 0")
      return
    }
    setSaving(true)
    try {
      await actualizarPresupuestoDependencia(modal.dep.id_dependencia, m)
      onToast("Presupuesto actualizado", `Se asignó ${fmtQ(m)} a ${modal.dep.nombre_dependencia}.`)
      setModal(null)
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : e instanceof Error ? e.message : "No se pudo actualizar")
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (dep: Dependencia) => {
    try {
      await cambiarEstadoDependencia(dep.id_dependencia, !dep.activo)
      onToast(
        dep.activo ? "Dependencia desactivada" : "Dependencia activada",
        dep.nombre_dependencia,
      )
      cargar()
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cambiar el estado")
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-bold text-gray-900">Catálogo de Dependencias</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Administre las unidades municipales, sus siglas y el presupuesto asignado por período.
          </p>
        </div>
        <button
          onClick={abrirCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm"
          style={{ backgroundColor: G }}
        >
          <Icons.Plus /> Nueva Dependencia
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["DEPENDENCIA", "SIGLAS", "UBICACIÓN", "EMPLEADOS", "ESTADO", "ACCIONES"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    Cargando dependencias…
                  </td>
                </tr>
              ) : deps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    Sin dependencias registradas.
                  </td>
                </tr>
              ) : (
                deps.map((d) => (
                  <tr key={d.id_dependencia} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-bold text-gray-900">{d.nombre_dependencia}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold text-gray-500">{d.siglas ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600">{d.ubicacion ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-gray-700">{d.total_empleados}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          d.activo
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {d.activo ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => abrirPresupuesto(d)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100"
                          style={{ color: G, backgroundColor: GL }}
                          title="Presupuesto"
                        >
                          Presupuesto
                        </button>
                        <button
                          onClick={() => abrirEdit(d)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Icons.Pencil />
                        </button>
                        <button
                          onClick={() => toggleActivo(d)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                          title={d.activo ? "Desactivar" : "Activar"}
                        >
                          {d.activo ? <Icons.X /> : <Icons.CheckMark />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (modal.mode === "create" || modal.mode === "edit") && (
        <div
          ref={overlayRef}
          onClick={(e) => e.target === overlayRef.current && setModal(null)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.52)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900">
              {modal.mode === "create" ? "Nueva Dependencia" : "Editar Dependencia"}
            </h3>
            <div className="space-y-4 mt-4">
              <FieldInput label="Nombre" val={nombre} set={setNombre} ph="Ej. Oficina de Agua" />
              <FieldInput label="Siglas" val={siglas} set={setSiglas} ph="Ej. OAG" />
              <FieldInput label="Ubicación" val={ubicacion} set={setUbicacion} ph="Ej. Edificio Municipal" />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={saving}
                className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: G }}
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && modal.mode === "presupuesto" && (
        <div
          ref={overlayRef}
          onClick={(e) => e.target === overlayRef.current && setModal(null)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.52)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900">
              Presupuesto · {modal.dep.nombre_dependencia}
            </h3>
            {cargandoPresupuesto ? (
              <p className="text-sm text-gray-400 mt-4">Consultando presupuesto…</p>
            ) : presupuesto ? (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Asignado</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{fmtQ(presupuesto.monto_asignado)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ejecutado</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{fmtQ(presupuesto.monto_ejecutado)}</p>
                  </div>
                </div>
                <div className="rounded-lg p-3 border" style={{ backgroundColor: GL, borderColor: GB }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: G }}>
                    Disponible
                  </p>
                  <p className="text-sm font-bold mt-1" style={{ color: G }}>
                    {fmtQ(presupuesto.monto_disponible)}
                  </p>
                </div>
                <FieldInput label="Nuevo monto asignado (Q)" val={montoNuevo} set={setMontoNuevo} />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-500">
                  No hay presupuesto para el período fiscal activo.
                </p>
                <FieldInput label="Monto asignado (Q)" val={montoNuevo} set={setMontoNuevo} />
              </div>
            )}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              >
                Cerrar
              </button>
              <button
                onClick={guardarPresupuesto}
                disabled={saving || cargandoPresupuesto}
                className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: G }}
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
