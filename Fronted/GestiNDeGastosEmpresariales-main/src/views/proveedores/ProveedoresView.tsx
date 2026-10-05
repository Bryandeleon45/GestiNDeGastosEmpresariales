import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { CONEXION_STYLE, PROV_KPI_META } from "@/models/proveedores"
import RolCell from "@/views/proveedores/RolCell"
import ConectarProveedorModal from "@/views/proveedores/ConectarProveedorModal"
import { useProveedoresController } from "@/controllers/useProveedoresController"

const KPI_ICONS: Record<string, React.ReactNode> = {
  total: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  activos: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  sinconexion: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
      <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0122.56 9" />
      <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
      <path d="M8.53 16.11a6 6 0 016.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  ),
  bloqueado: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
}

export default function ProveedoresView({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const {
    tab,
    setTab,
    page,
    setPage,
    q,
    setQ,
    loading,
    total,
    totalPages,
    pageRows,
    showConectar,
    setShowConectar,
    hoveredRow,
    setHoveredRow,
    resumen,
    tipos,
    rolesPortal,
    reload,
    cambiarRol,
    resetClave,
    toggleBloqueo,
    toggleEstado,
  } = useProveedoresController(onToast)

  const KPI_VALUES: Record<string, string> = {
    total: String(resumen.total),
    activos: String(resumen.activos_portal),
    sinconexion: String(resumen.sin_conexion),
    bloqueado: String(resumen.bloqueados),
  }

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span>Proveedores</span>
            <Icons.ChevRight />
            <span style={{ color: G }}>Gestión de Accesos</span>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                Gestión de Accesos — Proveedores
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Administración de roles, credenciales y conexión al portal
                municipal.
              </p>
            </div>
            <button
              onClick={() => setShowConectar(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 shrink-0"
              style={{ backgroundColor: G }}
            >
              <Icons.UserPlus />
              Conectar Nuevo Proveedor
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PROV_KPI_META.map((k) => (
              <div
                key={k.key}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: k.bg, color: k.color }}
                >
                  {KPI_ICONS[k.key]}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {k.label}
                  </p>
                  <p
                    className="text-3xl font-extrabold leading-none mt-0.5"
                    style={{ color: k.color }}
                  >
                    {KPI_VALUES[k.key]}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <h2 className="text-base font-bold text-gray-900">
                  Directorio de Accesos
                </h2>
                <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                  {(["Todos", "Activos", "Inactivos"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTab(t)
                        setPage(1)
                      }}
                      className="px-3 py-1 text-xs font-bold rounded-full transition-all"
                      style={
                        tab === t
                          ? { backgroundColor: G, color: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }
                          : { color: "#6B7280" }
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icons.Search />
                </span>
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Buscar por nombre o NIT…"
                  className="w-64 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-green-600 transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {[
                      "NOMBRE DEL PROVEEDOR / NIT",
                      "ROL ASIGNADO",
                      "ESTADO DE CONEXIÓN",
                      "ÚLTIMA ACTIVIDAD",
                      "ACCIONES DE SEGURIDAD",
                    ].map((h) => (
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
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                        Cargando proveedores…
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                        Sin proveedores para esta vista.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((p) => {
                      const cs = CONEXION_STYLE[p.estado]
                      return (
                        <tr
                          key={p.id}
                          onMouseEnter={() => setHoveredRow(p.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          className="border-b border-gray-50 last:border-0 transition-colors"
                          style={{ backgroundColor: hoveredRow === p.id ? "#F8FFFE" : "white" }}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-extrabold shrink-0"
                                style={{ backgroundColor: p.avatarColor, color: G }}
                              >
                                {p.initials}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 leading-none">
                                  {p.name}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                                  NIT: {p.nit}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <RolCell
                              rolId={p.rolId}
                              rolLabel={p.rol}
                              roles={rolesPortal}
                              onChange={(idRol, label) => cambiarRol(p, idRol, label)}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                              style={{ backgroundColor: cs.bg, color: cs.text }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: cs.dot }}
                              />
                              {p.estadoLabel}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-600">{p.ultimaActividad}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{p.categoria}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5">
                              <button
                                title="Restablecer credenciales"
                                disabled={!p.tieneAcceso}
                                onClick={() => resetClave(p)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Icons.Key />
                              </button>
                              {p.estado === "bloqueado" ? (
                                <button
                                  title="Desbloquear acceso"
                                  onClick={() => toggleBloqueo(p)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all"
                                >
                                  <Icons.ShieldCheck />
                                </button>
                              ) : (
                                <button
                                  title="Bloquear acceso"
                                  disabled={!p.tieneAcceso}
                                  onClick={() => toggleBloqueo(p)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                  >
                                    <rect x="3" y="11" width="18" height="11" rx="2" />
                                    <path d="M7 11V7a5 5 0 0110 0v4" />
                                  </svg>
                                </button>
                              )}
                              <button
                                title={p.activo ? "Desactivar proveedor" : "Activar proveedor"}
                                onClick={() => toggleEstado(p)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                              >
                                {p.activo ? <Icons.X /> : <Icons.CheckMark />}
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

            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 flex-wrap gap-3">
              <p className="text-xs text-gray-500">
                Mostrando <b className="text-gray-700">{pageRows.length}</b> de{" "}
                <b className="text-gray-700">{total}</b> proveedores registrados
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Icons.ChevLeft />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-all"
                    style={
                      pg === page
                        ? { backgroundColor: G, color: "white" }
                        : { border: "1px solid #E5E7EB", color: "#374151" }
                    }
                  >
                    {pg}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Icons.ChevRight />
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-gray-400 pb-2">
            © 2026 Municipalidad de Panajachel — Sistema de Gestión
            Administrativa. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {showConectar && (
        <ConectarProveedorModal
          onClose={() => setShowConectar(false)}
          onSuccess={() => {
            setShowConectar(false)
            reload()
          }}
          onToast={onToast}
          tipos={tipos}
          rolesPortal={rolesPortal}
        />
      )}
    </>
  )
}
