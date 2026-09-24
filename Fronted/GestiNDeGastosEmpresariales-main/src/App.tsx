import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import MunicipalSeal from "@/components/common/MunicipalSeal"
import { DashboardBarChart } from "@/components/charts/DashboardCharts"
import { ACTIVITY, STATUS_BADGE } from "@/models/dashboard"
import { useAppController } from "@/controllers/useAppController"

import SearchBar from "@/views/dashboard/SearchBar"
import NotificationBell from "@/views/dashboard/NotificationBell"
import HelpButton from "@/views/dashboard/HelpButton"
import StockAlertsCard from "@/views/dashboard/StockAlertsCard"
import BrandingCard from "@/views/dashboard/BrandingCard"
import SupportCard from "@/views/dashboard/SupportCard"
import SupportTicketDrawer from "@/views/dashboard/SupportTicketDrawer"
import JurisdictionModal from "@/views/dashboard/JurisdictionModal"
import AuditModal from "@/views/auditoria/AuditModal"
import SolicitudModal from "@/views/solicitudes/SolicitudModal"
import GastosModal from "@/views/solicitudes/GastosModal"
import DependenciasView from "@/views/solicitudes/DependenciasView"
import ProveedoresView from "@/views/proveedores/ProveedoresView"
import ProformasView from "@/views/proformas/ProformasView"
import FacturacionView from "@/views/facturacion/FacturacionView"
import BodegaView from "@/views/bodega/BodegaView"
import ReportesView from "@/views/reportes/ReportesView"
import ConfiguracionView from "@/views/configuracion/ConfiguracionView"
import UsuariosView from "@/views/usuarios/UsuariosView"
import SupplierPortal from "@/views/portal/SupplierPortal"
import LoginScreen from "@/views/auth/LoginScreen"
import CerrarSesionModal from "@/views/common/CerrarSesionModal"
import Toast from "@/views/common/Toast"
import KpiCard from "@/views/common/KpiCard"

const NAV_MAIN = [
  { key: "dashboard", label: "Dashboard", Icon: Icons.Dashboard },
  { key: "dependencias", label: "Dependencias", Icon: Icons.Dependencias },
  { key: "proveedores", label: "Proveedores", Icon: Icons.Proveedores },
  { key: "proformas", label: "Proformas", Icon: Icons.Proformas },
  { key: "facturacion", label: "Facturación", Icon: Icons.Facturacion },
  { key: "bodega", label: "Bodega", Icon: Icons.Bodega },
  { key: "reportes", label: "Reportes", Icon: Icons.Reportes },
  { key: "usuarios", label: "Usuarios", Icon: Icons.Users },
  { key: "configuracion", label: "Configuración", Icon: Icons.Config },
]

export default function App() {
  const {
    screen,
    setScreen,
    activeNav,
    setActiveNav,
    darkAdmin,
    setDarkAdmin,
    accentColor,
    setAccentColor,
    compactUI,
    setCompactUI,
    animEnabled,
    setAnimEnabled,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebar,
    setMobileSidebar,
    showSolModal,
    setShowSolModal,
    showGasModal,
    setShowGasModal,
    showAuditModal,
    setShowAuditModal,
    showTicketDrawer,
    setShowTicketDrawer,
    showLogoutModal,
    setShowLogoutModal,
    showMapModal,
    setShowMapModal,
    toast,
    fireToast,
    hideToast,
    DK,
    thBg,
    thSurface,
    thBorder,
    thText,
    thSub,
    thNav,
    ac,
    goToDash,
  } = useAppController()

  if (screen === "login")
    return (
      <LoginScreen
        onLogin={(pw) => setScreen(pw === "123456" ? "supplier" : "admin")}
      />
    )
  if (screen === "supplier")
    return <SupplierPortal onLogout={() => setScreen("login")} />

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div
        className="px-3 py-4 border-b flex items-center gap-2.5"
        style={{ borderColor: thBorder }}
      >
        <MunicipalSeal
          size={sidebarCollapsed && !mobile ? 36 : 40}
          onClick={goToDash}
        />
        {(!sidebarCollapsed || mobile) && (
          <div className="brand-text min-w-0">
            <p
              className="text-xs font-extrabold leading-none truncate"
              style={{ color: thText }}
            >
              Muni Panajachel
            </p>
            <p
              className="text-[10px] font-bold leading-none mt-0.5 uppercase tracking-wider truncate"
              style={{ color: ac }}
            >
              Gestión Administrativa
            </p>
          </div>
        )}
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_MAIN.map(({ key, label, Icon }) => {
          const active = activeNav === key
          return (
            <button
              key={key}
              onClick={() => {
                setActiveNav(key)
                setMobileSidebar(false)
              }}
              className="nav-btn w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-all text-left"
              title={sidebarCollapsed && !mobile ? label : undefined}
              style={{
                borderRadius: 12,
                backgroundColor: active ? ac : undefined,
                color: active ? "#FFFFFF" : thSub,
                boxShadow: active ? `0 1px 4px ${ac}44` : undefined,
                justifyContent:
                  sidebarCollapsed && !mobile ? "center" : undefined,
                paddingLeft: sidebarCollapsed && !mobile ? 0 : undefined,
                paddingRight: sidebarCollapsed && !mobile ? 0 : undefined,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = DK
                    ? "rgba(255,255,255,0.07)"
                    : GL
                  e.currentTarget.style.color = ac
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = ""
                  e.currentTarget.style.color = thSub
                }
              }}
            >
              <Icon />
              {(!sidebarCollapsed || mobile) && (
                <span className="nav-label">{label}</span>
              )}
            </button>
          )
        })}
      </nav>
      <div
        className="px-2 pb-3 border-t pt-2"
        style={{ borderColor: thBorder }}
      >
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          style={{
            justifyContent: sidebarCollapsed && !mobile ? "center" : undefined,
          }}
        >
          <Icons.Logout />
          {(!sidebarCollapsed || mobile) && (
            <span className="nav-label">Cerrar Sesión</span>
          )}
        </button>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        @keyframes modalIn { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes dropIn  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div
        className="flex h-screen overflow-hidden"
        style={{ background: thBg }}
      >
        {mobileSidebar && (
          <div
            className="sidebar-overlay lg:hidden"
            onClick={() => setMobileSidebar(false)}
          />
        )}
        <div
          className={`sidebar-drawer lg:hidden flex flex-col shadow-2xl ${
            mobileSidebar ? "open" : ""
          }`}
          style={{
            backgroundColor: thNav,
            borderRight: `1px solid ${thBorder}`,
          }}
        >
          <SidebarContent mobile />
        </div>

        <aside
          className="hidden lg:flex flex-col shrink-0 border-r shadow-sm transition-all duration-300"
          style={{
            width: sidebarCollapsed ? 56 : 208,
            backgroundColor: thNav,
            borderColor: thBorder,
          }}
        >
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="absolute top-4 z-10 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md transition-all hover:scale-110"
            style={{ left: sidebarCollapsed ? 44 : 196, backgroundColor: ac }}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              {sidebarCollapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
          <SidebarContent />
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header
            className="shrink-0 border-b px-4 md:px-6 flex items-center gap-3 shadow-sm"
            style={{
              height: 56,
              backgroundColor: thSurface,
              borderColor: thBorder,
            }}
          >
            <button
              onClick={() => setMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl transition-all hover:opacity-70"
              style={{ color: thSub }}
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
            <SearchBar />
            <div className="flex items-center gap-1 ml-auto">
              <NotificationBell onOpenAudit={() => setShowAuditModal(true)} />
              <HelpButton onOpenTicket={() => setShowTicketDrawer(true)} />
              <div
                className="h-8 w-px mx-2"
                style={{ backgroundColor: thBorder }}
              />
              <div className="flex items-center gap-2.5 pl-1">
                <div className="text-right hidden sm:block">
                  <p
                    className="text-xs font-bold leading-none"
                    style={{ color: thText }}
                  >
                    Lic. Ricardo Gómez
                  </p>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wide mt-0.5"
                    style={{ color: ac }}
                  >
                    Administrador General
                  </p>
                </div>
                <div
                  className="w-8 h-8 rounded-full overflow-hidden border-2 shrink-0"
                  style={{ borderColor: thBorder }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=64&h=64&fit=crop&auto=format"
                    alt="Lic. Ricardo Gómez"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </header>

          {activeNav === "dashboard" && (
            <div
              className="shrink-0 border-b px-6 py-4 flex items-center gap-8 flex-wrap"
              style={{ backgroundColor: thSurface, borderColor: thBorder }}
            >
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: thSub }}
                >
                  Total Solicitudes
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    className="text-2xl font-extrabold"
                    style={{ color: thText }}
                  >
                    1,248
                  </span>
                  <span className="text-xs font-semibold text-emerald-500">
                    +8% este mes
                  </span>
                </div>
              </div>
              <div
                className="h-10 w-px"
                style={{ backgroundColor: thBorder }}
              />
              <div className="flex-1 max-w-xs">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: thSub }}
                >
                  Presupuesto Ejecutado
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className="text-2xl font-extrabold"
                    style={{ color: thText }}
                  >
                    64.5%
                  </span>
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: DK ? "#334155" : "#F3F4F6" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: "64.5%", backgroundColor: ac }}
                    />
                  </div>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() => setShowAuditModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-lg transition-all hover:opacity-80"
                  style={{ color: ac, borderColor: ac }}
                >
                  <Icons.Activity />
                  <span className="hidden sm:block">Actividades</span>
                </button>
                <button
                  onClick={() => setActiveNav("dependencias")}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-lg shadow-sm transition-all hover:opacity-90 shrink-0"
                  style={{ backgroundColor: ac }}
                >
                  <Icons.Plus />
                  <span className="hidden sm:block">Nueva Solicitud</span>
                </button>
              </div>
            </div>
          )}

          {activeNav === "dependencias" ? (
            <DependenciasView
              onNewSolicitud={() => setShowSolModal(true)}
              onToast={(m, s) => fireToast(m, s)}
            />
          ) : activeNav === "proveedores" ? (
            <ProveedoresView onToast={(m, s) => fireToast(m, s)} />
          ) : activeNav === "proformas" ? (
            <ProformasView
              onToast={(m, s) => fireToast(m, s)}
              onNav={(k) => setActiveNav(k)}
            />
          ) : activeNav === "facturacion" ? (
            <FacturacionView
              onToast={(m, s) => fireToast(m, s)}
              onNav={(k) => setActiveNav(k)}
            />
          ) : activeNav === "bodega" ? (
            <BodegaView onToast={(m, s) => fireToast(m, s)} />
          ) : activeNav === "reportes" ? (
            <ReportesView onToast={(m, s) => fireToast(m, s)} />
          ) : activeNav === "usuarios" ? (
            <UsuariosView onToast={(m, s) => fireToast(m, s)} />
          ) : activeNav === "configuracion" ? (
            <ConfiguracionView
              onToast={(m, s) => fireToast(m, s)}
              onLogout={() => setShowLogoutModal(true)}
              dark={darkAdmin}
              onDark={setDarkAdmin}
              accent={accentColor}
              onAccent={setAccentColor}
              compact={compactUI}
              onCompact={setCompactUI}
              anim={animEnabled}
              onAnim={setAnimEnabled}
            />
          ) : (
            <div
              className="flex-1 overflow-auto p-5"
              style={{ background: thBg }}
            >
              <div className="flex gap-5 min-h-full">
                <div className="flex-1 min-w-0 flex flex-col gap-5">
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <KpiCard
                      title="Total Solicitudes"
                      value="1,248"
                      sub="↑ +8% este mes"
                      subColor="text-emerald-600"
                      icon={<Icons.Solicitudes />}
                    />
                    <KpiCard
                      title="Órdenes Pendientes"
                      value="42"
                      sub="Q 245,300.00 en trámite"
                      icon={<Icons.Bodega />}
                    />
                    <KpiCard
                      title="Entregas Parciales"
                      value="18"
                      sub="⚠ 8 requieren seguimiento"
                      subColor="text-amber-500"
                      icon={<Icons.Proformas />}
                    />
                    <KpiCard
                      title="Presupuesto Ejec."
                      value="64.5%"
                      sub="Q 2.9M de Q 4.5M"
                      subColor="text-gray-500"
                      icon={<Icons.Facturacion />}
                      progress={64.5}
                    />
                  </div>
                  <DashboardBarChart onBarClick={() => setShowGasModal(true)} />
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <h2 className="text-base font-bold text-gray-900">
                        Actividad Reciente
                      </h2>
                      <button
                        onClick={() => setShowAuditModal(true)}
                        className="text-sm font-semibold transition-colors hover:opacity-70"
                        style={{ color: G }}
                      >
                        Ver Todo
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            {[
                              "NO. SOLICITUD",
                              "DEPENDENCIA",
                              "MONTO",
                              "ESTADO",
                              "ACCIÓN",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ACTIVITY.map((row) => (
                            <tr
                              key={row.sol}
                              className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                            >
                              <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 font-mono">
                                {row.sol}
                              </td>
                              <td className="px-5 py-3.5 text-sm text-gray-700">
                                {row.dep}
                              </td>
                              <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 font-mono whitespace-nowrap">
                                {row.monto}
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[row.status]}`}
                                >
                                  {row.status}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <button
                                  className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                                  style={{ color: G }}
                                >
                                  <Icons.Eye />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="w-60 shrink-0 flex-col gap-4 hidden lg:flex">
                  <StockAlertsCard
                    onRestock={(itemName) => {
                      const msg = itemName
                        ? `Orden generada para: ${itemName}`
                        : "Orden de reabastecimiento generada para ítems críticos"
                      fireToast(
                        msg,
                        "La solicitud fue enviada a bodega central.",
                      )
                    }}
                  />
                  <BrandingCard onOpenMap={() => setShowMapModal(true)} />
                  <SupportCard onOpenTicket={() => setShowTicketDrawer(true)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSolModal && (
        <SolicitudModal
          onClose={() => setShowSolModal(false)}
          onSubmit={() => {
            setShowSolModal(false)
            setTimeout(
              () =>
                fireToast(
                  "Solicitud creada exitosamente",
                  "SOL-2024-046 enviada para aprobación.",
                ),
              150,
            )
          }}
        />
      )}
      {showGasModal && (
        <GastosModal
          onClose={() => setShowGasModal(false)}
          onPDF={() => {
            setShowGasModal(false)
            setTimeout(
              () =>
                fireToast(
                  "Reporte descargado con éxito",
                  "El archivo PDF fue generado correctamente.",
                ),
              150,
            )
          }}
        />
      )}
      {showAuditModal && (
        <AuditModal
          onClose={() => setShowAuditModal(false)}
          onExport={() => {
            setShowAuditModal(false)
            setTimeout(
              () =>
                fireToast(
                  "Audit log exportado",
                  "El archivo CSV/PDF fue descargado correctamente.",
                ),
              150,
            )
          }}
        />
      )}
      {showTicketDrawer && (
        <SupportTicketDrawer
          onClose={() => setShowTicketDrawer(false)}
          onSubmit={() => {
            setShowTicketDrawer(false)
            setTimeout(
              () =>
                fireToast(
                  "Ticket enviado exitosamente",
                  "Redirigiendo al Centro de Soporte DAFIM...",
                ),
              150,
            )
          }}
        />
      )}
      {showMapModal && (
        <JurisdictionModal onClose={() => setShowMapModal(false)} />
      )}
      {showLogoutModal && (
        <CerrarSesionModal
          onClose={() => setShowLogoutModal(false)}
          onConfirm={() => {
            setShowLogoutModal(false)
            setTimeout(() => {
              setScreen("login")
              setActiveNav("dashboard")
            }, 280)
          }}
        />
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        sub={toast.sub}
        onHide={hideToast}
      />

      <button
        onClick={() => setActiveNav("dependencias")}
        className="fixed bottom-5 right-5 w-12 h-12 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:opacity-90 z-50"
        style={{ backgroundColor: G }}
        title="Nueva Solicitud"
      >
        <Icons.Plus />
      </button>
    </>
  )
}
