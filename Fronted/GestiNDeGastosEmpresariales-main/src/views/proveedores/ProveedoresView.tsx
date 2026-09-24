import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { ALL_PROVEEDORES, CONEXION_STYLE } from "@/models/proveedores"
import RolCell from "@/views/proveedores/RolCell"
import ConectarProveedorModal from "@/views/proveedores/ConectarProveedorModal"
import RowMenu from "@/views/common/RowMenu"
import { useProveedoresController } from "@/controllers/useProveedoresController"

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
    showConectar,
    setShowConectar,
    hoveredRow,
    setHoveredRow,
    roles,
    setRoles,
    filtered,
    totalPages,
    pageRows,
    activos,
  } = useProveedoresController()

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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Conectar Nuevo Proveedor
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "TOTAL USUARIOS",
                value: ALL_PROVEEDORES.length.toString(),
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                  >
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                ),
              },
              {
                label: "ACTIVOS PORTAL",
                value: activos.toString(),
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                ),
              },
              {
                label: "SIN CONEXIÓN",
                value: ALL_PROVEEDORES.filter(
                  (p) => p.estado === "Sin Conexión",
                ).length.toString(),
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                  >
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
                    <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
                    <path d="M10.71 5.05A16 16 0 0122.56 9" />
                    <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
                    <path d="M8.53 16.11a6 6 0 016.95 0" />
                    <line x1="12" y1="20" x2="12.01" y2="20" />
                  </svg>
                ),
              },
              {
                label: "ACCESO BLOQUEADO",
                value: ALL_PROVEEDORES.filter(
                  (p) => p.estado === "Acceso Bloqueado",
                ).length.toString(),
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                ),
              },
            ].map((k, i) => {
              const colors = [G, G, "#D97706", "#DC2626"]
              return (
                <div
                  key={k.label}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor:
                        i === 2 ? "#FEF3C7" : i === 3 ? "#FEE2E2" : GL,
                      color: colors[i],
                    }}
                  >
                    {k.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {k.label}
                    </p>
                    <p
                      className="text-3xl font-extrabold leading-none mt-0.5"
                      style={{ color: colors[i] }}
                    >
                      {k.value}
                    </p>
                  </div>
                </div>
              )
            })}
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
                          ? {
                              backgroundColor: G,
                              color: "white",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                            }
                          : { color: "#6B7280" }
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-70"
                style={{ color: G }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                Filtros Avanzados
              </button>
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
                  {pageRows.map((p) => {
                    const cs = CONEXION_STYLE[p.estado]
                    return (
                      <tr
                        key={p.id}
                        onMouseEnter={() => setHoveredRow(p.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className="border-b border-gray-50 last:border-0 transition-colors"
                        style={{
                          backgroundColor:
                            hoveredRow === p.id ? "#F8FFFE" : "white",
                        }}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-extrabold shrink-0"
                              style={{
                                backgroundColor: p.avatarColor,
                                color: G,
                              }}
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
                            value={roles[p.id]}
                            onChange={(v) => {
                              setRoles((r) => ({ ...r, [p.id]: v }))
                              onToast("Rol actualizado", `${p.name} → ${v}`)
                            }}
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
                            {p.estado}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600">
                            {p.ultimaActividad}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {p.categoria}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              title="Ver credenciales"
                              onClick={() =>
                                onToast(
                                  "Credenciales",
                                  `Acceso de ${p.name} copiado al portapapeles.`,
                                )
                              }
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                              >
                                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                              </svg>
                            </button>
                            {p.estado === "Acceso Bloqueado" ? (
                              <button
                                title="Desbloquear acceso"
                                onClick={() =>
                                  onToast(
                                    "Acceso restaurado",
                                    `${p.name} fue desbloqueado.`,
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                >
                                  <rect
                                    x="3"
                                    y="11"
                                    width="18"
                                    height="11"
                                    rx="2"
                                  />
                                  <path d="M7 11V7a5 5 0 019.9-1" />
                                </svg>
                              </button>
                            ) : (
                              <button
                                title="Bloquear acceso"
                                onClick={() =>
                                  onToast(
                                    "Acceso bloqueado",
                                    `${p.name} fue bloqueado temporalmente.`,
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                >
                                  <rect
                                    x="3"
                                    y="11"
                                    width="18"
                                    height="11"
                                    rx="2"
                                  />
                                  <path d="M7 11V7a5 5 0 0110 0v4" />
                                </svg>
                              </button>
                            )}
                            <RowMenu
                              onVer={() =>
                                onToast(
                                  "Perfil del proveedor",
                                  `${p.name} — ${p.email}`,
                                )
                              }
                              onEditar={() =>
                                onToast(
                                  "Editando proveedor",
                                  `${p.name} abierto para edición.`,
                                )
                              }
                              onAprobar={() =>
                                onToast(
                                  "Acceso aprobado",
                                  `${p.name} habilitado en el portal.`,
                                )
                              }
                              onRechazar={() =>
                                onToast(
                                  "Acceso denegado",
                                  `${p.name} fue desconectado.`,
                                )
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 flex-wrap gap-3">
              <p className="text-xs text-gray-500">
                Mostrando <b className="text-gray-700">{pageRows.length}</b> de{" "}
                <b className="text-gray-700">{ALL_PROVEEDORES.length}</b>{" "}
                proveedores registrados
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Icons.ChevLeft />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pg) => (
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
                  ),
                )}
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
            © 2023 Municipalidad de Panajachel — Sistema de Gestión
            Administrativa. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {showConectar && (
        <ConectarProveedorModal
          onClose={() => setShowConectar(false)}
          onSubmit={() => {
            setShowConectar(false)
            setTimeout(
              () =>
                onToast(
                  "Proveedor conectado",
                  "Las credenciales fueron enviadas por correo.",
                ),
              150,
            )
          }}
        />
      )}
    </>
  )
}
