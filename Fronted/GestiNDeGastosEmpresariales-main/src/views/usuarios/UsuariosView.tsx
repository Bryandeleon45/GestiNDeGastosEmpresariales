import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { USER_ESTADO_STYLE } from "@/models/usuarios"
import NuevoUsuarioModal from "@/views/usuarios/NuevoUsuarioModal"
import { useUsuariosController } from "@/controllers/useUsuariosController"

export default function UsuariosView({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const {
    usuarios,
    search,
    setSearch,
    filterEst,
    setFilterEst,
    page,
    setPage,
    modalUser,
    setModalUser,
    PAGE_SIZE,
    filtered,
    totalPages,
    paginated,
    clearFilters,
    handleSave,
    toggleEstado,
    totActivos,
    totInactivos,
    totAcceso,
  } = useUsuariosController(onToast)

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
              Usuarios
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muni-sub)" }}>
              Gestión de personal administrativo con acceso al sistema
            </p>
          </div>
          <button
            onClick={() => setModalUser(null)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 active:scale-95 shrink-0"
            style={{ backgroundColor: G }}
          >
            <Icons.UserPlus /> Nuevo Usuario
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "TOTAL USUARIOS",
              value: usuarios.length,
              sub: "Personal registrado",
              color: G,
              icon: <Icons.Users />,
            },
            {
              label: "ACTIVOS",
              value: totActivos,
              sub: `${Math.round((totActivos / usuarios.length) * 100)}% del total`,
              color: "#16A34A",
              icon: <Icons.UserCheck />,
            },
            {
              label: "INACTIVOS",
              value: totInactivos,
              sub: "Fuera de servicio",
              color: "#DC2626",
              icon: <Icons.UserX />,
            },
            {
              label: "CON ACCESO",
              value: totAcceso,
              sub: "Al sistema digital",
              color: "#2563EB",
              icon: <Icons.Shield />,
            },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-xl border p-5 shadow-sm"
              style={{
                backgroundColor: "var(--muni-surface)",
                borderColor: "var(--muni-border)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <p
                  className="text-[10px] font-extrabold uppercase tracking-widest leading-tight"
                  style={{ color: "var(--muni-sub)" }}
                >
                  {k.label}
                </p>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${k.color}18`, color: k.color }}
                >
                  {k.icon}
                </div>
              </div>
              <p
                className="text-4xl font-extrabold font-mono leading-none"
                style={{ color: k.color }}
              >
                {k.value}
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--muni-sub)" }}>
                {k.sub}
              </p>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl border p-4 flex flex-wrap items-center gap-3"
          style={{
            backgroundColor: "var(--muni-surface)",
            borderColor: "var(--muni-border)",
          }}
        >
          <div
            className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm"
            style={{
              backgroundColor: "var(--muni-bg)",
              borderColor: "var(--muni-border)",
            }}
          >
            <Icons.Search />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Buscar por nombre, código o DPI..."
              className="bg-transparent outline-none flex-1 min-w-0 text-sm"
              style={{ color: "var(--muni-text)" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="shrink-0 opacity-50 hover:opacity-100"
                style={{ color: "var(--muni-sub)" }}
              >
                <Icons.X />
              </button>
            )}
          </div>
          <select
            value={filterEst}
            onChange={(e) => {
              setFilterEst(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2.5 text-sm rounded-xl border outline-none cursor-pointer"
            style={{
              backgroundColor: "var(--muni-bg)",
              borderColor: "var(--muni-border)",
              color: "var(--muni-text)",
            }}
          >
            <option value="todos">Todos los Estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all hover:opacity-80"
            style={{
              color: "var(--muni-sub)",
              borderColor: "var(--muni-border)",
            }}
          >
            Limpiar filtros
          </button>
        </div>

        <div
          className="rounded-xl border overflow-hidden shadow-sm"
          style={{
            backgroundColor: "var(--muni-surface)",
            borderColor: "var(--muni-border)",
          }}
        >
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    borderColor: "var(--muni-border)",
                    backgroundColor: "var(--muni-surface2)",
                  }}
                >
                  {[
                    "CÓDIGO",
                    "NOMBRE COMPLETO",
                    "DPI",
                    "ESTADO",
                    "TELÉFONO",
                    "INGRESO",
                    "ACCIONES",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap"
                      style={{ color: "var(--muni-sub)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm"
                      style={{ color: "var(--muni-sub)" }}
                    >
                      No se encontraron usuarios con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  paginated.map((u) => {
                    const es = USER_ESTADO_STYLE[u.estado]
                    return (
                      <tr
                        key={u.id}
                        className="border-b last:border-b-0 transition-colors"
                        style={{ borderColor: "var(--muni-border)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "var(--muni-surface2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "")
                        }
                      >
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-extrabold font-mono"
                            style={{ color: G }}
                          >
                            {u.codigo}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                              style={{ backgroundColor: G }}
                            >
                              {u.nombre[0]}
                            </div>
                            <p
                              className="text-sm font-semibold whitespace-nowrap"
                              style={{ color: "var(--muni-text)" }}
                            >
                              {u.nombre}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-mono"
                            style={{ color: "var(--muni-sub)" }}
                          >
                            {u.dpi}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{ backgroundColor: es.bg, color: es.color }}
                          >
                            {u.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-mono"
                            style={{ color: "var(--muni-sub)" }}
                          >
                            {u.telefono || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs"
                            style={{ color: "var(--muni-sub)" }}
                          >
                            {u.ingreso}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setModalUser(u)}
                              title="Editar"
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                              style={{ backgroundColor: GL, color: G }}
                            >
                              <Icons.Pencil />
                            </button>
                            <button
                              onClick={() =>
                                onToast("Perfil de usuario", u.nombre)
                              }
                              title="Ver perfil"
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                              style={{
                                backgroundColor: "#EFF6FF",
                                color: "#2563EB",
                              }}
                            >
                              <Icons.Eye />
                            </button>
                            <button
                              onClick={() => toggleEstado(u.id)}
                              title={
                                u.estado === "Activo" ? "Desactivar" : "Activar"
                              }
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                              style={{
                                backgroundColor:
                                  u.estado === "Activo" ? "#FEF2F2" : "#F0FDF4",
                                color:
                                  u.estado === "Activo" ? "#DC2626" : "#16A34A",
                              }}
                            >
                              {u.estado === "Activo" ? (
                                <Icons.UserX />
                              ) : (
                                <Icons.UserCheck />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div
            className="md:hidden divide-y"
            style={{ borderColor: "var(--muni-border)" }}
          >
            {paginated.length === 0 ? (
              <p
                className="px-4 py-10 text-center text-sm"
                style={{ color: "var(--muni-sub)" }}
              >
                No se encontraron usuarios.
              </p>
            ) : (
              paginated.map((u) => {
                const es = USER_ESTADO_STYLE[u.estado]
                return (
                  <div key={u.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                          style={{ backgroundColor: G }}
                        >
                          {u.nombre[0]}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-bold truncate"
                            style={{ color: "var(--muni-text)" }}
                          >
                            {u.nombre}
                          </p>
                          <p
                            className="text-[10px] font-extrabold font-mono"
                            style={{ color: G }}
                          >
                            {u.codigo}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: es.bg, color: es.color }}
                      >
                        {u.estado}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-4 text-xs"
                      style={{ color: "var(--muni-sub)" }}
                    >
                      <span>Tel: {u.telefono || "—"}</span>
                      <span>Ingreso: {u.ingreso}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setModalUser(u)}
                        className="flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all"
                        style={{ color: G, borderColor: G }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleEstado(u.id)}
                        className="flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all"
                        style={{
                          color: u.estado === "Activo" ? "#DC2626" : "#16A34A",
                          borderColor:
                            u.estado === "Activo" ? "#DC2626" : "#16A34A",
                        }}
                      >
                        {u.estado === "Activo" ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div
            className="flex items-center justify-between gap-4 px-5 py-3 border-t flex-wrap"
            style={{
              borderColor: "var(--muni-border)",
              backgroundColor: "var(--muni-surface2)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--muni-sub)" }}>
              Mostrando{" "}
              <strong style={{ color: "var(--muni-text)" }}>
                {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </strong>{" "}
              de{" "}
              <strong style={{ color: "var(--muni-text)" }}>
                {filtered.length}
              </strong>{" "}
              registros
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40"
                style={{
                  borderColor: "var(--muni-border)",
                  color: "var(--muni-sub)",
                }}
              >
                <Icons.ChevLeft />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all border"
                  style={{
                    backgroundColor: n === page ? G : "transparent",
                    color: n === page ? "#FFFFFF" : "var(--muni-sub)",
                    borderColor: n === page ? G : "var(--muni-border)",
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40"
                style={{
                  borderColor: "var(--muni-border)",
                  color: "var(--muni-sub)",
                }}
              >
                <Icons.ChevRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalUser !== undefined && (
        <NuevoUsuarioModal
          usuario={modalUser}
          onClose={() => setModalUser(undefined)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
