import { useEffect, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  listarCatalogosInfo,
  listarCatalogo,
  crearCatalogo,
  editarCatalogo,
  cambiarEstadoCatalogo,
  listarDiasInhabiles,
  crearDiaInhabil,
  eliminarDiaInhabil,
  listarParametros,
  cambiarParametro,
  type CatalogoInfo,
  type DiaInhabil,
  type Parametro,
} from "@/api/configuracion"

const CATALOGO_DEFS: Record<string, { titulo: string; nombre: string; campos: { key: string; label: string }[] }> = {
  categorias: {
    titulo: "Categorías",
    nombre: "nombre",
    campos: [
      { key: "nombre", label: "Nombre" },
      { key: "descripcion", label: "Descripción" },
    ],
  },
  "unidades-medida": {
    titulo: "Unidades de medida",
    nombre: "nombre",
    campos: [
      { key: "nombre", label: "Nombre" },
      { key: "simbolo", label: "Símbolo" },
    ],
  },
  partidas: {
    titulo: "Partidas presupuestarias",
    nombre: "descripcion",
    campos: [
      { key: "codigo", label: "Código" },
      { key: "descripcion", label: "Descripción" },
    ],
  },
  "fuentes-financiamiento": {
    titulo: "Fuentes de financiamiento",
    nombre: "descripcion",
    campos: [
      { key: "codigo", label: "Código" },
      { key: "descripcion", label: "Descripción" },
    ],
  },
  puestos: {
    titulo: "Puestos",
    nombre: "descripcion",
    campos: [
      { key: "descripcion", label: "Descripción" },
      { key: "salario_base", label: "Salario base" },
    ],
  },
}

type SubTab = "catalogos" | "dias" | "parametros"

export default function CatalogosParametrosTab({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const [sub, setSub] = useState<SubTab>("catalogos")

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-gray-100">
        {(
          [
            { key: "catalogos", label: "Catálogos" },
            { key: "dias", label: "Días inhábiles" },
            { key: "parametros", label: "Parámetros" },
          ] as { key: SubTab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className="px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2"
            style={{
              color: sub === t.key ? G : "#6B7280",
              borderColor: sub === t.key ? G : "transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "catalogos" && <CatalogosPanel onToast={onToast} />}
      {sub === "dias" && <DiasInhabilesPanel onToast={onToast} />}
      {sub === "parametros" && <ParametrosPanel onToast={onToast} />}
    </div>
  )
}

function CatalogosPanel({ onToast }: { onToast: (m: string, s: string) => void }) {
  const [catalogos, setCatalogos] = useState<CatalogoInfo[]>([])
  const [clave, setClave] = useState("")
  const [registros, setRegistros] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<{ modo: "create" } | { modo: "edit"; reg: Record<string, unknown> } | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const def = CATALOGO_DEFS[clave]

  useEffect(() => {
    listarCatalogosInfo()
      .then((c) => {
        setCatalogos(c)
        if (c[0]) setClave(c[0].clave)
      })
      .catch(() => onToast("Error", "No se pudieron cargar los catálogos."))
  }, [])

  useEffect(() => {
    if (!clave) return
    setLoading(true)
    listarCatalogo(clave)
      .then((r) => setRegistros(r))
      .catch(() => onToast("Error", "No se pudo cargar el catálogo."))
      .finally(() => setLoading(false))
  }, [clave])

  const abrirCreate = () => {
    const f: Record<string, string> = {}
    for (const c of def?.campos ?? []) f[c.key] = ""
    setForm(f)
    setModal({ modo: "create" })
  }

  const abrirEdit = (reg: Record<string, unknown>) => {
    const f: Record<string, string> = {}
    for (const c of def?.campos ?? []) f[c.key] = String(reg[c.key] ?? "")
    setForm(f)
    setModal({ modo: "edit", reg })
  }

  const guardar = async () => {
    setSaving(true)
    try {
      if (modal?.modo === "edit") {
        const id = Number(modal.reg.id)
        await editarCatalogo(clave, id, form)
        onToast("Registro actualizado", "Los cambios fueron guardados.")
      } else {
        await crearCatalogo(clave, form)
        onToast("Registro creado", "El elemento fue agregado al catálogo.")
      }
      setModal(null)
      setLoading(true)
      listarCatalogo(clave).then(setRegistros).finally(() => setLoading(false))
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo guardar.")
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (reg: Record<string, unknown>) => {
    const activo = Boolean(reg.activo)
    const id = Number(reg.id)
    try {
      await cambiarEstadoCatalogo(clave, id, !activo)
      setLoading(true)
      listarCatalogo(clave).then(setRegistros).finally(() => setLoading(false))
    } catch {
      onToast("Error", "No se pudo cambiar el estado.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-green-600"
        >
          {catalogos.map((c) => (
            <option key={c.clave} value={c.clave}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          onClick={abrirCreate}
          disabled={!def}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
          style={{ backgroundColor: G }}
        >
          <Icons.Plus /> Nuevo
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {(def?.campos ?? []).map((c) => (
                  <th key={c.key} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={(def?.campos.length ?? 0) + 2} className="px-4 py-10 text-center text-sm text-gray-400">
                    Cargando…
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={(def?.campos.length ?? 0) + 2} className="px-4 py-10 text-center text-sm text-gray-400">
                    Sin registros.
                  </td>
                </tr>
              ) : (
                registros.map((reg) => (
                  <tr key={String(reg.id)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    {(def?.campos ?? []).map((c) => (
                      <td key={c.key} className="px-4 py-3.5">
                        <p className="text-sm text-gray-700">{String(reg[c.key] ?? "—")}</p>
                      </td>
                    ))}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          reg.activo ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {reg.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => abrirEdit(reg)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all" title="Editar">
                          <Icons.Pencil />
                        </button>
                        <button onClick={() => toggleActivo(reg)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all" title={reg.activo ? "Desactivar" : "Activar"}>
                          {reg.activo ? <Icons.X /> : <Icons.CheckMark />}
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

      {modal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.52)" }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900">
              {modal.modo === "create" ? `Nuevo · ${def?.titulo}` : `Editar · ${def?.titulo}`}
            </h3>
            <div className="space-y-4 mt-4">
              {(def?.campos ?? []).map((c) => (
                <div key={c.key}>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{c.label}</label>
                  <input
                    value={form[c.key] ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [c.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={guardar} disabled={saving} className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: G }}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DiasInhabilesPanel({ onToast }: { onToast: (m: string, s: string) => void }) {
  const [dias, setDias] = useState<DiaInhabil[]>([])
  const [loading, setLoading] = useState(true)
  const [fecha, setFecha] = useState("")
  const [descripcion, setDescripcion] = useState("")

  const cargar = () => {
    setLoading(true)
    listarDiasInhabiles()
      .then(setDias)
      .catch(() => onToast("Error", "No se pudieron cargar los días inhábiles."))
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const agregar = async () => {
    if (!fecha) {
      onToast("Revisar formulario", "La fecha es obligatoria.")
      return
    }
    try {
      await crearDiaInhabil({ fecha, descripcion: descripcion || undefined })
      onToast("Día inhábil agregado", fecha)
      setFecha("")
      setDescripcion("")
      cargar()
    } catch {
      onToast("Error", "No se pudo agregar el día inhábil.")
    }
  }

  const eliminar = async (id: number) => {
    try {
      await eliminarDiaInhabil(id)
      cargar()
    } catch {
      onToast("Error", "No se pudo eliminar el día inhábil.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Fecha</label>
          <input value={fecha} onChange={(e) => setFecha(e.target.value)} type="date" className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-green-600" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Descripción</label>
          <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej. Asueto municipal" className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-green-600" />
        </div>
        <button onClick={agregar} className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: G }}>
          Agregar
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Descripción</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-400">Cargando…</td>
              </tr>
            ) : dias.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-400">Sin días inhábiles.</td>
              </tr>
            ) : (
              dias.map((d) => (
                <tr key={d.id_dia_inhabil} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-900">{d.fecha}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-gray-600">{d.descripcion ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button onClick={() => eliminar(Number(d.id_dia_inhabil))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                      <Icons.X />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ParametrosPanel({ onToast }: { onToast: (m: string, s: string) => void }) {
  const [grupo, setGrupo] = useState("")
  const [params, setParams] = useState<Parametro[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Parametro | null>(null)
  const [valor, setValor] = useState("")

  const cargar = () => {
    setLoading(true)
    listarParametros(grupo || undefined)
      .then(setParams)
      .catch(() => onToast("Error", "No se pudieron cargar los parámetros."))
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [grupo])

  const abrirEditar = (p: Parametro) => {
    setEditando(p)
    setValor(p.valor)
  }

  const guardar = async () => {
    if (!editando) return
    try {
      await cambiarParametro(editando.clave, valor)
      onToast("Parámetro actualizado", editando.clave)
      setEditando(null)
      cargar()
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo actualizar el parámetro.")
    }
  }

  const grupos = ["", "SEGURIDAD", "COMPRAS", "PAGOS", "PROVEEDORES", "BODEGA", "SISTEMA"]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={grupo} onChange={(e) => setGrupo(e.target.value)} className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-green-600">
          {grupos.map((g) => (
            <option key={g} value={g}>
              {g === "" ? "Todos los grupos" : g}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Clave", "Valor", "Grupo", "Descripción", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Cargando…</td>
                </tr>
              ) : (
                params.map((p) => (
                  <tr key={p.clave} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-bold text-gray-900 font-mono">{p.clave}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold" style={{ color: G }}>{p.valor}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold text-gray-500">{p.grupo}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600">{p.descripcion}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={() => abrirEditar(p)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all" title="Editar">
                        <Icons.Pencil />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editando && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.52)" }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900">Editar parámetro · {editando.clave}</h3>
            <p className="text-xs text-gray-500 mt-1">{editando.descripcion}</p>
            <div className="mt-4">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Valor</label>
              <input value={valor} onChange={(e) => setValor(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600" />
              {editando.valor_min != null || editando.valor_max != null ? (
                <p className="text-xs text-gray-400 mt-1">
                  Rango: {editando.valor_min ?? "—"} a {editando.valor_max ?? "—"}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setEditando(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={guardar} className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90" style={{ backgroundColor: G }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
