import { useState, useEffect } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  listarRoles,
  crearRol,
  permisosDeRol,
  guardarPermisosRol,
  type Rol,
  type SubmenuPermiso,
} from "@/api/roles"

export default function RolesView({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const [roles, setRoles] = useState<Rol[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [matrix, setMatrix] = useState<SubmenuPermiso[]>([])
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [offline, setOffline] = useState(false)

  const [showNew, setShowNew] = useState(false)
  const [newDesc, setNewDesc] = useState("")
  const [newNombre, setNewNombre] = useState("")
  const [savingRol, setSavingRol] = useState(false)

  const loadRoles = async () => {
    try {
      const rs = await listarRoles()
      setRoles(rs)
      setOffline(false)
      return rs
    } catch {
      setOffline(true)
      return []
    }
  }

  const loadPermisos = async (id: number) => {
    setLoading(true)
    try {
      const rows = await permisosDeRol(id)
      setMatrix(rows)
      setChecked(new Set(rows.filter((r) => r.permitido).map((r) => r.id_submenu)))
      setOffline(false)
    } catch {
      setOffline(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles().then((rs) => {
      if (rs[0]) {
        setSelectedId(rs[0].id_rol)
        loadPermisos(rs[0].id_rol)
      }
    })
  }, [])

  const toggle = (idSubmenu: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(idSubmenu)) next.delete(idSubmenu)
      else next.add(idSubmenu)
      return next
    })
  }

  const savePermisos = async () => {
    if (selectedId == null) return
    try {
      await guardarPermisosRol(selectedId, Array.from(checked))
      onToast("Permisos actualizados", "La matriz del rol fue guardada.")
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo guardar")
    }
  }

  const createRol = async () => {
    if (!newDesc.trim()) return
    setSavingRol(true)
    try {
      await crearRol({ descripcion: newDesc, nombre_rol: newNombre || undefined })
      setNewDesc("")
      setNewNombre("")
      setShowNew(false)
      const rs = await loadRoles()
      const last = rs[rs.length - 1]
      if (last) {
        setSelectedId(last.id_rol)
        loadPermisos(last.id_rol)
      }
      onToast("Rol creado", newDesc)
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo crear")
    } finally {
      setSavingRol(false)
    }
  }

  const menus = new Map<string, SubmenuPermiso[]>()
  for (const row of matrix) {
    if (!menus.has(row.menu)) menus.set(row.menu, [])
    menus.get(row.menu)!.push(row)
  }
  const selectedRol = roles.find((r) => r.id_rol === selectedId)

  return (
    <div
      className="flex-1 overflow-auto p-5"
      style={{ background: "var(--muni-bg)" }}
    >
      <div className="space-y-5 max-w-full">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl font-extrabold leading-tight"
              style={{ color: "var(--muni-text)" }}
            >
              Roles y Permisos
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muni-sub)" }}>
              Asignación de permisos por rol sobre los menús del sistema
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 active:scale-95 shrink-0"
            style={{ backgroundColor: G }}
          >
            <Icons.Plus /> Nuevo Rol
          </button>
        </div>

        {offline && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200">
            <Icons.Warning />
            Sin conexión con el servidor. Los datos no se están sincronizando.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <div
            className="rounded-xl border overflow-hidden self-start"
            style={{
              backgroundColor: "var(--muni-surface)",
              borderColor: "var(--muni-border)",
            }}
          >
            <div
              className="px-4 py-3 border-b"
              style={{
                borderColor: "var(--muni-border)",
                backgroundColor: "var(--muni-surface2)",
              }}
            >
              <p
                className="text-[10px] font-extrabold uppercase tracking-widest"
                style={{ color: "var(--muni-sub)" }}
              >
                Roles del Sistema
              </p>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--muni-border)" }}>
              {roles.length === 0 && (
                <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--muni-sub)" }}>
                  No hay roles registrados.
                </p>
              )}
              {roles.map((r) => {
                const active = r.id_rol === selectedId
                return (
                  <button
                    key={r.id_rol}
                    onClick={() => {
                      setSelectedId(r.id_rol)
                      loadPermisos(r.id_rol)
                    }}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left transition-colors"
                    style={{
                      backgroundColor: active ? GL : undefined,
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-sm font-bold truncate"
                        style={{ color: "var(--muni-text)" }}
                      >
                        {r.nombre_rol || r.descripcion}
                      </p>
                      <p
                        className="text-[10px] text-xs"
                        style={{ color: "var(--muni-sub)" }}
                      >
                        {r.total_usuarios} usuarios
                      </p>
                    </div>
                    {!r.activo && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Inactivo
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{
              backgroundColor: "var(--muni-surface)",
              borderColor: "var(--muni-border)",
            }}
          >
            <div
              className="flex items-center justify-between gap-3 px-5 py-4 border-b"
              style={{
                borderColor: "var(--muni-border)",
                backgroundColor: "var(--muni-surface2)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: GL, color: G }}
                >
                  <Icons.Shield />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--muni-text)" }}>
                    {selectedRol
                      ? selectedRol.nombre_rol || selectedRol.descripcion
                      : "Seleccione un rol"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muni-sub)" }}>
                    Marque los submenús a los que el rol tendrá acceso
                  </p>
                </div>
              </div>
              <button
                onClick={savePermisos}
                disabled={selectedId == null || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50 shrink-0"
                style={{ backgroundColor: G }}
              >
                <Icons.CheckMark /> Guardar Permisos
              </button>
            </div>

            <div className="p-5 space-y-5">
              {loading ? (
                <p className="py-10 text-center text-sm" style={{ color: "var(--muni-sub)" }}>
                  Cargando permisos…
                </p>
              ) : matrix.length === 0 ? (
                <p className="py-10 text-center text-sm" style={{ color: "var(--muni-sub)" }}>
                  Seleccione un rol para ver su matriz de permisos.
                </p>
              ) : (
                Array.from(menus.entries()).map(([menu, submenus]) => (
                  <div key={menu}>
                    <p
                      className="text-[10px] font-extrabold uppercase tracking-widest mb-2"
                      style={{ color: G }}
                    >
                      {menu}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {submenus.map((s) => {
                        const on = checked.has(s.id_submenu)
                        return (
                          <label
                            key={s.id_submenu}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-colors"
                            style={{
                              borderColor: on ? G : "var(--muni-border)",
                              backgroundColor: on ? GL : "var(--muni-surface2)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggle(s.id_submenu)}
                              className="w-4 h-4 accent-[#1E5E2F] shrink-0"
                            />
                            <span
                              className="text-sm font-medium"
                              style={{ color: "var(--muni-text)" }}
                            >
                              {s.submenu}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showNew && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNew(false)}
          />
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: GL, color: G }}
                  >
                    <Icons.Shield />
                  </div>
                  <h2 className="text-lg font-extrabold text-gray-900">Nuevo Rol</h2>
                </div>
                <button
                  onClick={() => setShowNew(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"
                >
                  <Icons.X />
                </button>
              </div>
              <div className="px-6 py-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Ej. Jefe de Bodega"
                    className="w-full px-3 py-2.5 text-sm border rounded-xl outline-none focus:border-[#1E5E2F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Nombre corto{" "}
                    <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    placeholder="Ej. Bodega"
                    className="w-full px-3 py-2.5 text-sm border rounded-xl outline-none focus:border-[#1E5E2F]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setShowNew(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={createRol}
                  disabled={savingRol}
                  className="px-6 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: G }}
                >
                  {savingRol ? "Creando…" : "Crear Rol"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
