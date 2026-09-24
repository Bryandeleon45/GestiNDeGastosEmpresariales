import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import MunicipalSeal from "@/components/common/MunicipalSeal"
import {
  SOL_ESTADO_PROV,
  ORDENES_PROV,
  ENTREGAS_PROV,
  type SupplierNav,
} from "@/models/portalProveedor"
import CerrarSesionModal from "@/views/common/CerrarSesionModal"
import Toast from "@/views/common/Toast"
import NuevaProformaModal from "@/views/portal/NuevaProformaModal"
import SubirProformaModal from "@/views/portal/SubirProformaModal"
import { useSupplierPortalController } from "@/controllers/useSupplierPortalController"

export default function SupplierPortal({ onLogout }: { onLogout: () => void }) {
  const {
    activeNav,
    setActiveNav,
    dark,
    setDark,
    solFilter,
    setSolFilter,
    proformaTarget,
    setProformaTarget,
    showSubir,
    setShowSubir,
    isDraggingFEL,
    setIsDraggingFEL,
    toast,
    fireToast,
    hideToast,
    showLogout,
    setShowLogout,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    filteredSols,
  } = useSupplierPortalController()

  const bg = dark ? "#0F172A" : "#F8F9FA"
  const card = dark ? "#1E293B" : "#FFFFFF"
  const border = dark ? "#334155" : "#F1F5F9"
  const text = dark ? "#F8FAFC" : "#111827"
  const sub = dark ? "#94A3B8" : "#6B7280"
  const sidebarBg = dark ? "#1E293B" : "#FFFFFF"

  const NAV_PROV: { key: SupplierNav label: string icon: React.ReactNode }[] = [
    {
      key: "oportunidades",
      label: "Mis Oportunidades",
      icon: <Icons.Solicitudes />,
    },
    {
      key: "ordenes",
      label: "Órdenes y Facturas",
      icon: <Icons.Facturacion />,
    },
    { key: "entregas", label: "Entregas en Bodega", icon: <Icons.Bodega /> },
    { key: "configuracion", label: "Configuración", icon: <Icons.Config /> },
  ]

  const goHome = () => {
    setActiveNav("oportunidades")
    setMobileSidebarOpen(false)
  }

  const SupplierSidebarContent = ({
    inDrawer = false,
  }: {
    inDrawer?: boolean
  }) => {
    const collapsed = !inDrawer && sidebarCollapsed
    return (
      <div
        className="flex flex-col h-full"
        style={{ backgroundColor: sidebarBg }}
      >
        <div
          className="px-3 py-4 border-b flex items-center gap-2.5"
          style={{ borderColor: border }}
        >
          <MunicipalSeal size={32} onClick={goHome} />
          {!collapsed && (
            <div className="min-w-0">
              <p
                className="text-xs font-extrabold truncate leading-none"
                style={{ color: text }}
              >
                Portal de Proveedores
              </p>
              <p className="text-[10px] truncate mt-0.5" style={{ color: sub }}>
                Municipalidad de Panajachel
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div
            className="mx-3 mt-3 px-2 py-1.5 rounded-lg text-[10px] font-semibold truncate"
            style={{ backgroundColor: dark ? "#0F172A" : GL, color: G }}
          >
            Suministros El Lago S.A.
          </div>
        )}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_PROV.map(({ key, label, icon }) => {
            const active = activeNav === key
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveNav(key)
                  setMobileSidebarOpen(false)
                }}
                title={collapsed ? label : undefined}
                className="w-full flex items-center gap-2.5 text-sm font-medium transition-all"
                style={{
                  borderRadius: 12,
                  padding: collapsed ? "10px 0" : "10px 12px",
                  justifyContent: collapsed ? "center" : undefined,
                  backgroundColor: active ? G : undefined,
                  color: active ? "#FFFFFF" : sub,
                  boxShadow: active
                    ? "0 1px 4px rgba(30,94,47,0.2)"
                    : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = dark
                      ? "rgba(30,94,47,0.15)"
                      : "#F0FDF4"
                    e.currentTarget.style.color = G
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = sub
                  }
                }}
              >
                {icon}
                {!collapsed && <span>{label}</span>}
              </button>
            )
          })}
        </nav>
        <div
          className="px-2 pb-4 border-t pt-2"
          style={{ borderColor: border }}
        >
          <button
            onClick={() => setShowLogout(true)}
            title={sidebarCollapsed && !inDrawer ? "Cerrar Sesión" : undefined}
            className="w-full flex items-center gap-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
            style={{
              padding: collapsed ? "10px 0" : "10px 12px",
              justifyContent: collapsed ? "center" : undefined,
            }}
          >
            <Icons.Logout />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: bg }}>
      {mobileSidebarOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div
        className={`sidebar-drawer lg:hidden ${
          mobileSidebarOpen ? "open" : ""
        }`}
        style={{
          backgroundColor: sidebarBg,
          borderRight: `1px solid ${border}`,
        }}
      >
        <SupplierSidebarContent inDrawer={true} />
      </div>

      <aside
        className="hidden lg:flex flex-col shrink-0 border-r relative transition-all duration-300"
        style={{
          width: sidebarCollapsed ? 56 : 224,
          backgroundColor: sidebarBg,
          borderColor: border,
        }}
      >
        <SupplierSidebarContent />
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full border flex items-center justify-center z-10 transition-all hover:scale-110"
          style={{
            backgroundColor: sidebarBg,
            borderColor: border,
            color: sub,
          }}
        >
          <svg
            className="w-3 h-3 transition-transform"
            style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header
          className="shrink-0 px-4 py-3 flex items-center gap-3 border-b"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl transition-all hover:opacity-70 shrink-0"
            style={{ color: sub }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="lg:hidden shrink-0">
            <MunicipalSeal size={28} onClick={goHome} />
          </div>
          <div
            className="flex-1 hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-sm max-w-sm"
            style={{
              backgroundColor: dark ? "#0F172A" : "#F9FAFB",
              borderColor: border,
            }}
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke={sub}
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder="Buscar solicitud o licitación..."
              className="bg-transparent outline-none text-sm flex-1 min-w-0"
              style={{ color: text }}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              className="relative p-2 rounded-xl transition-all hover:opacity-70"
              style={{ color: sub }}
            >
              <Icons.Bell />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <div
              className="flex items-center gap-2 pl-2 border-l"
              style={{ borderColor: border }}
            >
              <div
                className="w-8 h-8 rounded-full overflow-hidden border-2 shrink-0"
                style={{ borderColor: GB }}
              >
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&auto=format"
                  alt="Proveedor"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-right hidden md:block">
                <p
                  className="text-xs font-bold leading-none"
                  style={{ color: text }}
                >
                  Suministros El Lago S.A.
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: sub }}>
                  NIT: 459823-1
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto" style={{ background: bg }}>
          <div className="px-4 sm:px-6 py-5 space-y-5 pb-24 lg:pb-5">
            {activeNav === "oportunidades" && (
              <>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1
                      className="text-2xl font-extrabold leading-tight"
                      style={{ color: text }}
                    >
                      Mis Oportunidades y Cotizaciones
                    </h1>
                    <p className="text-sm mt-1" style={{ color: sub }}>
                      Revise los requerimientos publicados por la Municipalidad
                      de Panajachel y envíe sus proformas.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSubir(true)}
                    className="hidden lg:flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 shrink-0"
                    style={{ backgroundColor: G }}
                  >
                    <Icons.Plus /> Subir Proforma Directa
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      icon: <Icons.Solicitudes />,
                      label: "COTIZACIONES ENVIADAS",
                      value: "18",
                      sub2: "4 en revisión técnica",
                      subColor: sub,
                    },
                    {
                      icon: <Icons.Proformas />,
                      label: "ÓRDENES ADJUDICADAS",
                      value: "05",
                      sub2: "Q 85,400.00 en ejecución",
                      subColor: G,
                    },
                    {
                      icon: <Icons.Facturacion />,
                      label: "FACTURAS PENDIENTES",
                      value: "02",
                      sub2: "Próximo pago: 25/08/2026",
                      subColor: "#D97706",
                    },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className="rounded-xl border p-5"
                      style={{ backgroundColor: card, borderColor: border }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <p
                          className="text-[10px] font-extrabold uppercase tracking-widest"
                          style={{ color: sub }}
                        >
                          {k.label}
                        </p>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: dark ? "rgba(30,94,47,0.25)" : GL,
                            color: G,
                          }}
                        >
                          {k.icon}
                        </div>
                      </div>
                      <p
                        className="text-4xl font-extrabold font-mono"
                        style={{ color: text }}
                      >
                        {k.value}
                      </p>
                      <p
                        className="text-xs font-semibold mt-1.5"
                        style={{ color: k.subColor }}
                      >
                        {k.sub2}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-5 items-start flex-wrap xl:flex-nowrap">
                  <div
                    className="flex-1 min-w-0 rounded-xl border overflow-hidden"
                    style={{ backgroundColor: card, borderColor: border }}
                  >
                    <div
                      className="px-5 pt-4 pb-0 border-b"
                      style={{ borderColor: border }}
                    >
                      <p
                        className="text-base font-extrabold mb-3"
                        style={{ color: text }}
                      >
                        Solicitudes de Compra Activas
                      </p>
                      <div className="flex gap-0 overflow-x-auto">
                        {(["todas", "pendientes", "enviadas"] as const).map(
                          (f) => {
                            const labels = {
                              todas: "Todas",
                              pendientes: "Pendientes de Cotizar",
                              enviadas: "Enviadas",
                            }
                            const active = solFilter === f
                            return (
                              <button
                                key={f}
                                onClick={() => setSolFilter(f)}
                                className="relative px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                                style={{ color: active ? G : sub }}
                              >
                                {labels[f]}
                                {active && (
                                  <span
                                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                                    style={{ backgroundColor: G }}
                                  />
                                )}
                              </button>
                            )
                          },
                        )}
                      </div>
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full min-w-[540px]">
                        <thead>
                          <tr
                            className="border-b"
                            style={{
                              borderColor: border,
                              backgroundColor: dark ? "#0F172A" : "#F9FAFB",
                            }}
                          >
                            {[
                              "NO. SOLICITUD",
                              "CATEGORÍA",
                              "FECHA LÍMITE",
                              "PRESUPUESTO",
                              "ESTADO",
                              "ACCIONES",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest"
                                style={{ color: sub }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSols.map((sol) => {
                            const es = SOL_ESTADO_PROV[sol.estado]
                            return (
                              <tr
                                key={sol.id}
                                className="border-b transition-colors"
                                style={{ borderColor: border }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = dark
                                    ? "rgba(255,255,255,0.03)"
                                    : "#F9FFF9")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor = "")
                                }
                              >
                                <td className="px-4 py-4">
                                  <p
                                    className="text-sm font-extrabold"
                                    style={{ color: G }}
                                  >
                                    {sol.num}
                                  </p>
                                </td>
                                <td className="px-4 py-4">
                                  <p
                                    className="text-sm"
                                    style={{ color: text }}
                                  >
                                    {sol.cat}
                                  </p>
                                </td>
                                <td className="px-4 py-4">
                                  <p className="text-sm" style={{ color: sub }}>
                                    {sol.limite}
                                  </p>
                                </td>
                                <td className="px-4 py-4">
                                  <p
                                    className="text-sm font-bold font-mono"
                                    style={{ color: text }}
                                  >
                                    {sol.presupuesto}
                                  </p>
                                </td>
                                <td className="px-4 py-4">
                                  <span
                                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                                    style={{
                                      backgroundColor: es.bg,
                                      color: es.color,
                                    }}
                                  >
                                    {sol.estado}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  {sol.estado === "En Licitación" ? (
                                    <button
                                      onClick={() => setProformaTarget(sol)}
                                      className="px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95"
                                      style={{ backgroundColor: G }}
                                    >
                                      Enviar Cotización
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        fireToast(
                                          sol.estado === "Adjudicado"
                                            ? "Orden de Compra"
                                            : "Mi Proforma",
                                          `Cargando documento de ${sol.num}...`,
                                        )
                                      }
                                      className="px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all hover:opacity-80"
                                      style={{ color: G, borderColor: G }}
                                    >
                                      {sol.estado === "Adjudicado"
                                        ? "Ver Orden de Compra"
                                        : "Ver Mi Proforma"}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div
                      className="md:hidden divide-y"
                      style={{ borderColor: border }}
                    >
                      {filteredSols.map((sol) => {
                        const es = SOL_ESTADO_PROV[sol.estado]
                        return (
                          <div key={sol.id} className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className="text-sm font-extrabold"
                                style={{ color: G }}
                              >
                                {sol.num}
                              </p>
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: es.bg,
                                  color: es.color,
                                }}
                              >
                                {sol.estado}
                              </span>
                            </div>
                            <p
                              className="text-sm font-medium"
                              style={{ color: text }}
                            >
                              {sol.cat}
                            </p>
                            <div
                              className="flex items-center justify-between text-xs"
                              style={{ color: sub }}
                            >
                              <span>Límite: {sol.limite}</span>
                              <span
                                className="font-bold font-mono"
                                style={{ color: text }}
                              >
                                {sol.presupuesto}
                              </span>
                            </div>
                            <div className="pt-1">
                              {sol.estado === "En Licitación" ? (
                                <button
                                  onClick={() => setProformaTarget(sol)}
                                  className="w-full py-2 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95"
                                  style={{ backgroundColor: G }}
                                >
                                  Enviar Cotización
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    fireToast(
                                      sol.estado === "Adjudicado"
                                        ? "Orden de Compra"
                                        : "Mi Proforma",
                                      `Cargando documento de ${sol.num}...`,
                                    )
                                  }
                                  className="w-full py-2 text-xs font-bold rounded-lg border-2 transition-all hover:opacity-80"
                                  style={{ color: G, borderColor: G }}
                                >
                                  {sol.estado === "Adjudicado"
                                    ? "Ver Orden de Compra"
                                    : "Ver Mi Proforma"}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div
                    className="w-full xl:w-64 shrink-0 rounded-xl border overflow-hidden"
                    style={{ backgroundColor: card, borderColor: border }}
                  >
                    <div
                      className="px-5 pt-5 pb-4 border-b"
                      style={{ borderColor: border }}
                    >
                      <p
                        className="text-sm font-extrabold"
                        style={{ color: text }}
                      >
                        Carga Rápida de Factura FEL
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: sub }}>
                        Envíe su factura electrónica directamente.
                      </p>
                    </div>
                    <div className="p-5 space-y-4">
                      <div
                        onDragOver={(e) => {
                          e.preventDefault()
                          setIsDraggingFEL(true)
                        }}
                        onDragLeave={() => setIsDraggingFEL(false)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setIsDraggingFEL(false)
                          fireToast(
                            "Factura recibida",
                            "El documento FEL fue enviado a revisión de pago.",
                          )
                        }}
                        onClick={() =>
                          fireToast(
                            "Factura recibida",
                            "El documento FEL fue enviado a revisión de pago.",
                          )
                        }
                        className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-8 gap-2 cursor-pointer transition-all"
                        style={{
                          borderColor: isDraggingFEL
                            ? G
                            : dark
                              ? "#334155"
                              : "#CBD5E1",
                          backgroundColor: isDraggingFEL
                            ? dark
                              ? "rgba(30,94,47,0.15)"
                              : "#F0FDF4"
                            : dark
                              ? "#0F172A"
                              : "#F9FAFB",
                        }}
                      >
                        <svg
                          className="w-9 h-9"
                          fill="none"
                          stroke={isDraggingFEL ? G : sub}
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <polyline points="16 16 12 12 8 16" />
                          <line x1="12" y1="12" x2="12" y2="21" />
                          <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                        </svg>
                        <p
                          className="text-xs text-center leading-snug font-semibold"
                          style={{ color: sub }}
                        >
                          Arrastre aquí su factura digital
                          <br />
                          (PDF / XML)
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          fireToast(
                            "Factura enviada",
                            "Tu factura FEL fue enviada a revisión de pago.",
                          )
                        }
                        className="w-full py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                        style={{ backgroundColor: G }}
                      >
                        Enviar a Revisión de Pago
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeNav === "ordenes" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-extrabold" style={{ color: text }}>
                  Órdenes y Facturas
                </h1>
                <p className="text-sm" style={{ color: sub }}>
                  Historial de órdenes de compra adjudicadas y estado de pago de
                  sus facturas.
                </p>
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ backgroundColor: card, borderColor: border }}
                >
                  {ORDENES_PROV.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 transition-colors"
                      style={{ borderColor: border }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = dark
                          ? "rgba(255,255,255,0.03)"
                          : "#F9FFF9")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "")
                      }
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: dark ? "rgba(30,94,47,0.25)" : GL,
                          color: G,
                        }}
                      >
                        <Icons.Doc />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-bold"
                          style={{ color: text }}
                        >
                          {r.oc}
                        </p>
                        <p className="text-xs" style={{ color: sub }}>
                          {r.desc}
                        </p>
                      </div>
                      <p
                        className="text-sm font-extrabold font-mono"
                        style={{ color: text }}
                      >
                        {r.monto}
                      </p>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={
                          r.estado === "Pagado"
                            ? { backgroundColor: "#DCFCE7", color: "#16A34A" }
                            : r.estado === "En Proceso"
                              ? { backgroundColor: "#FEF9C3", color: "#92400E" }
                              : { backgroundColor: "#FEE2E2", color: "#DC2626" }
                        }
                      >
                        {r.estado}
                      </span>
                      <p className="text-xs" style={{ color: sub }}>
                        {r.fecha}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeNav === "entregas" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-extrabold" style={{ color: text }}>
                  Entregas en Bodega
                </h1>
                <p className="text-sm" style={{ color: sub }}>
                  Programación y estado de sus entregas físicas en la bodega
                  municipal.
                </p>
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ backgroundColor: card, borderColor: border }}
                >
                  {ENTREGAS_PROV.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 transition-colors"
                      style={{ borderColor: border }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = dark
                          ? "rgba(255,255,255,0.03)"
                          : "#F9FFF9")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "")
                      }
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: dark ? "rgba(30,94,47,0.25)" : GL,
                          color: G,
                        }}
                      >
                        <Icons.Bodega />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-bold"
                          style={{ color: text }}
                        >
                          {r.oc} · {r.items}
                        </p>
                        <p className="text-xs" style={{ color: sub }}>
                          {r.fecha} · {r.bodeguero}
                        </p>
                      </div>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={
                          r.estado === "Completada"
                            ? { backgroundColor: "#DCFCE7", color: "#16A34A" }
                            : r.estado === "Programada"
                              ? { backgroundColor: "#E0F2FE", color: "#0284C7" }
                              : { backgroundColor: "#FEF9C3", color: "#92400E" }
                        }
                      >
                        {r.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeNav === "configuracion" && (
              <div className="space-y-5 max-w-lg">
                <h1 className="text-2xl font-extrabold" style={{ color: text }}>
                  Configuración
                </h1>
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ backgroundColor: card, borderColor: border }}
                >
                  <div
                    className="flex items-center justify-between px-5 py-4 border-b"
                    style={{ borderColor: border }}
                  >
                    <div>
                      <p className="text-sm font-bold" style={{ color: text }}>
                        Modo Oscuro
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: sub }}>
                        Cambia el tema del portal entre claro y oscuro.
                      </p>
                    </div>
                    <button
                      onClick={() => setDark((v) => !v)}
                      role="switch"
                      aria-checked={dark}
                      className="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0"
                      style={{ backgroundColor: dark ? G : "#D1D5DB" }}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300"
                        style={{
                          transform: dark
                            ? "translateX(24px)"
                            : "translateX(0)",
                        }}
                      />
                    </button>
                  </div>
                  <div
                    className="px-5 py-4 border-b"
                    style={{ borderColor: border }}
                  >
                    <p className="text-sm font-bold" style={{ color: text }}>
                      Proveedor
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: sub }}>
                      Suministros El Lago S.A. · NIT: 459823-1
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm font-bold" style={{ color: text }}>
                      Correo de Contacto
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: sub }}>
                      ventas@suministroselago.com
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLogout(true)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90"
                  style={{ backgroundColor: "#DC2626" }}
                >
                  <Icons.Logout /> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeNav === "oportunidades" && (
        <button
          onClick={() => setShowSubir(true)}
          className="fixed bottom-6 right-5 lg:hidden flex items-center gap-2 px-4 py-3 text-sm font-bold text-white rounded-2xl shadow-lg active:scale-95 transition-all z-30"
          style={{
            backgroundColor: G,
            boxShadow: "0 4px 20px rgba(30,94,47,0.4)",
          }}
        >
          <Icons.Plus />
          <span className="hidden xs:inline">Subir Proforma</span>
        </button>
      )}

      {proformaTarget && (
        <NuevaProformaModal
          sol={proformaTarget}
          dark={dark}
          onClose={() => setProformaTarget(null)}
          onToast={fireToast}
        />
      )}
      {showSubir && (
        <SubirProformaModal
          dark={dark}
          onClose={() => setShowSubir(false)}
          onToast={fireToast}
        />
      )}
      {showLogout && (
        <CerrarSesionModal
          onClose={() => setShowLogout(false)}
          onConfirm={() => {
            setShowLogout(false)
            setTimeout(onLogout, 280)
          }}
        />
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        sub={toast.sub}
        onHide={hideToast}
      />
    </div>
  )
}
