import { useEffect, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  listarPeriodos,
  crearPeriodo,
  activarPeriodo,
  cerrarPeriodo,
  listarPresupuestos,
  guardarPresupuesto,
  type PeriodoFiscal,
  type PresupuestoDependencia,
} from "@/api/periodosFiscales"

const fmtQ = (n: number | string | null | undefined) =>
  `Q ${Number(n ?? 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

export default function PeriodoFiscalTab({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const [periodos, setPeriodos] = useState<PeriodoFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [anio, setAnio] = useState(String(new Date().getFullYear() + 1))
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [saving, setSaving] = useState(false)

  const [presupuestoPeriodo, setPresupuestoPeriodo] = useState<PeriodoFiscal | null>(null)
  const [presupuestos, setPresupuestos] = useState<PresupuestoDependencia[]>([])
  const [montos, setMontos] = useState<Record<number, string>>({})

  const cargar = async () => {
    setLoading(true)
    try {
      setPeriodos(await listarPeriodos())
    } catch {
      onToast("Error", "No se pudieron cargar los períodos fiscales.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const crear = async () => {
    const a = parseInt(anio, 10)
    if (!a || Number.isNaN(a)) {
      onToast("Revisar formulario", "El año es obligatorio.")
      return
    }
    setSaving(true)
    try {
      await crearPeriodo({ anio: a, fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined })
      onToast("Período creado", `Período fiscal ${a} registrado.`)
      setShowCreate(false)
      setAnio(String(a + 1))
      setFechaInicio("")
      setFechaFin("")
      cargar()
    } catch {
      onToast("Error", "No se pudo crear el período.")
    } finally {
      setSaving(false)
    }
  }

  const activar = async (p: PeriodoFiscal) => {
    try {
      await activarPeriodo(p.id_periodo)
      onToast("Período activado", `Período ${p.anio} ahora es el activo.`)
      cargar()
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo activar el período.")
    }
  }

  const cerrar = async (p: PeriodoFiscal) => {
    if (!window.confirm(`¿Cerrar el período fiscal ${p.anio}?`)) return
    try {
      await cerrarPeriodo(p.id_periodo)
      onToast("Período cerrado", `Período ${p.anio} cerrado.`)
      cargar()
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cerrar el período.")
    }
  }

  const abrirPresupuesto = async (p: PeriodoFiscal) => {
    setPresupuestoPeriodo(p)
    try {
      const data = await listarPresupuestos(p.id_periodo)
      setPresupuestos(data)
      const m: Record<number, string> = {}
      for (const d of data) m[d.id_dependencia] = d.monto_asignado
      setMontos(m)
    } catch {
      onToast("Error", "No se pudo cargar el presupuesto.")
      setPresupuestoPeriodo(null)
    }
  }

  const guardarMonto = async (d: PresupuestoDependencia) => {
    const m = parseFloat(montos[d.id_dependencia] ?? "0")
    if (Number.isNaN(m) || m < 0) {
      onToast("Revisar formulario", "Ingrese un monto válido.")
      return
    }
    try {
      await guardarPresupuesto(presupuestoPeriodo!.id_periodo, d.id_dependencia, m)
      onToast("Presupuesto guardado", `Monto asignado a ${d.nombre_dependencia}.`)
    } catch {
      onToast("Error", "No se pudo guardar el presupuesto.")
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-bold text-gray-900">Período Fiscal</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Administre los períodos fiscales y el presupuesto asignado por dependencia.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm"
          style={{ backgroundColor: G }}
        >
          <Icons.Plus /> Nuevo Período
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["AÑO", "ESTADO", "PRESUPUESTO", "INICIO", "FIN", "ACCIONES"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    Cargando períodos…
                  </td>
                </tr>
              ) : periodos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    Sin períodos registrados.
                  </td>
                </tr>
              ) : (
                periodos.map((p) => (
                  <tr key={p.id_periodo} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-bold text-gray-900">{p.anio}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.cerrado ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                          Cerrado
                        </span>
                      ) : p.activo ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-gray-700">{fmtQ(p.presupuesto_total)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600">{p.fecha_inicio ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600">{p.fecha_fin ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => abrirPresupuesto(p)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:bg-gray-100"
                          style={{ color: G, backgroundColor: GL }}
                        >
                          Presupuesto
                        </button>
                        {!p.cerrado && !p.activo && (
                          <button
                            onClick={() => activar(p)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
                            style={{ backgroundColor: G }}
                          >
                            Activar
                          </button>
                        )}
                        {!p.cerrado && (
                          <button
                            onClick={() => cerrar(p)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-red-600 border border-red-200 transition-all hover:bg-red-50"
                          >
                            Cerrar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 space-y-4">
          <h4 className="text-sm font-bold text-gray-900">Nuevo Período Fiscal</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Año</label>
              <input
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                type="number"
                className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Fecha inicio</label>
              <input
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                type="date"
                className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Fecha fin</label>
              <input
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                type="date"
                className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-white transition-all">
              Cancelar
            </button>
            <button onClick={crear} disabled={saving} className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: G }}>
              {saving ? "Creando…" : "Crear Período"}
            </button>
          </div>
        </div>
      )}

      {presupuestoPeriodo && (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700">
              Presupuesto · Período {presupuestoPeriodo.anio}
            </p>
            <button onClick={() => setPresupuestoPeriodo(null)} className="text-xs font-bold text-gray-500 hover:text-gray-700">
              Cerrar
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {presupuestos.map((d) => (
              <div key={d.id_dependencia} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{d.nombre_dependencia}</p>
                  <p className="text-xs text-gray-400">{d.siglas ?? "—"}</p>
                </div>
                <input
                  value={montos[d.id_dependencia] ?? ""}
                  onChange={(e) => setMontos((prev) => ({ ...prev, [d.id_dependencia]: e.target.value }))}
                  type="number"
                  step="0.01"
                  className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-green-600"
                />
                <button
                  onClick={() => guardarMonto(d)}
                  className="text-xs font-bold px-3 py-2 rounded-lg text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: G }}
                >
                  Guardar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
