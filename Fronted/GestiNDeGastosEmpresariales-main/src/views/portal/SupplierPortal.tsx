import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import MunicipalSeal from "@/components/common/MunicipalSeal"
import CerrarSesionModal from "@/views/common/CerrarSesionModal"
import Toast from "@/views/common/Toast"
import SubirProformaModal from "@/views/portal/SubirProformaModal"
import CotizarOportunidadModal from "@/views/portal/CotizarOportunidadModal"
import { useSupplierPortalController } from "@/controllers/useSupplierPortalController"
import type { Oportunidad } from "@/api/portal"

const ESTADO_BADGE: Record<string, { bg: string; color: string }> = {
  Nueva: { bg: "#E0F2FE", color: "#0284C7" },
  Abierta: { bg: "#E0F2FE", color: "#0284C7" },
  Cotizada: { bg: "#DCFCE7", color: "#16A34A" },
  Adjudicada: { bg: "#22C55E", color: "#FFFFFF" },
  "No adjudicada": { bg: "#FEE2E2", color: "#DC2626" },
  Declinada: { bg: "#F3F4F6", color: "#6B7280" },
  Vencida: { bg: "#FEF9C3", color: "#92400E" },
  Cancelada: { bg: "#F3F4F6", color: "#6B7280" },
  Cerrada: { bg: "#F3F4F6", color: "#6B7280" },
}

const ORDEN_BADGE: Record<string, { bg: string; color: string }> = {
  Entregada: { bg: "#DCFCE7", color: "#16A34A" },
  Enviada: { bg: "#E0F2FE", color: "#0284C7" },
  Aprobada: { bg: "#DCFCE7", color: "#16A34A" },
  Pendiente: { bg: "#FEF9C3", color: "#92400E" },
  Cancelada: { bg: "#FEE2E2", color: "#DC2626" },
}

const ENTREGA_BADGE: Record<string, { bg: string; color: string }> = {
  Completa: { bg: "#DCFCE7", color: "#16A34A" },
  Parcial: { bg: "#FEF9C3", color: "#92400E" },
  "Con Novedades": { bg: "#FEF9C3", color: "#92400E" },
  "En Proceso": { bg: "#E0F2FE", color: "#0284C7" },
  Cancelada: { bg: "#FEE2E2", color: "#DC2626" },
}

const fmtQ = (n: number | string) =>
  `Q ${Number(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

const fmtFecha = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-GT") : "—"

const esCotizable = (o: Oportunidad) =>
  o.fase === "Publicada" && (o.estado === "Nueva" || o.estado === "Abierta")

export default function SupplierPortal({ onLogout }: { onLogout: () => void }) {
  const {
    activeNav,
    setActiveNav,
    dark,
    setDark,
    tab,
    setTab,
    q,
    setQ,
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
    perfil,
    resumen,
    oportunidades,
    ordenes,
    entregas,
    noLeidas,
    loading,
    recargar,
    abrirOportunidad,
    cotizarTarget,
    cerrarCotizar,
    guardarBorrador,
    enviar,
    declinar,
  } = useSupplierPortalController()

  const bg = dark ? "#0F172A" : "#F8F9FA"
  const card = dark ? "#1E293B" : "#FFFFFF"
  const border = dark ? "#334155" : "#F1F5F9"
  const text = dark ? "#F8FAFC" : "#111827"
  const sub = dark ? "#94A3B8" : "#6B7280"
  const sidebarBg = dark ? "#1E293B" : "#FFFFFF"

  const razonSocial = perfil?.razon_social ?? "Portal de Proveedores"
  const nit = perfil?.nit ?? ""

  const KPIS = [
    { key: "abiertas", label: "OPORTUNIDADES ABIERTAS", value: String(resumen?.abiertas ?? 0), sub2: `${resumen?.por_vencer ?? 0} por vencer`, icon: <Icons.Solicitudes /> },
    { key: "cotizadas", label: "COTIZACIONES ENVIADAS", value: String(resumen?.cotizaciones_enviadas ?? 0), sub2: `${resumen?.en_evaluacion ?? 0} en evaluación`, icon: <Icons.Proformas /> },
    { key: "adjudicadas", label: "ÓRDENES ADJUDICADAS", value: String(resumen?.adjudicadas ?? 0), sub2: `${fmtQ(resumen?.monto_ejecucion ?? 0)} en ejecución`, subColor: "#1E5E2F", icon: <Icons.Facturacion /> },
    { key: "facturas", label: "FACTURAS PENDIENTES", value: String(resumen?.facturas_pendientes ?? 0), sub2: `${resumen?.ordenes ?? 0} órdenes de compra`, subColor: "#D97706", icon: <Icons.Doc /> },
  ]

  const NAV_PROV = [
    { key: "oportunidades" as const, label: "Mis Oportunidades", icon: <Icons.Solicitudes /> },
    { key: "ordenes" as const, label: "Órdenes y Facturas", icon: <Icons.Facturacion /> },
    { key: "entregas" as const, label: "Entregas en Bodega", icon: <Icons.Bodega /> },
    { key: "configuracion" as const, label: "Configuración", icon: <Icons.Config /> },
  ]

  const goHome = () => {
    setActiveNav("oportunidades")
    setMobileSidebarOpen(false)
  }

  const TABS = [
    { key: "abiertas" as const, label: "Abiertas" },
    { key: "cotizadas" as const, label: "Mis Cotizaciones" },
    { key: "adjudicadas" as const, label: "Adjudicadas" },
    { key: "historial" as const, label: "Historial" },
  ]

  const SupplierSidebarContent = ({ inDrawer = false }: { inDrawer?: boolean }) => {
    const collapsed = !inDrawer && sidebarCollapsed
    return (
      <div className="flex flex-col h-full" style={{ backgroundColor: sidebarBg }}>
        <div className="px-3 py-4 border-b flex items-center gap-2.5" style={{ borderColor: border }}>
          <MunicipalSeal size={32} onClick={goHome} />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-extrabold truncate leading-none" style={{ color: text }}>
                Portal de Proveedores
              </p>
              <p className="text-[10px] truncate mt-0.5" style={{ color: sub }}>
                Municipalidad de Panajachel
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="mx-3 mt-3 px-2 py-1.5 rounded-lg text-[10px] font-semibold truncate" style={{ backgroundColor: dark ? "#0F172A" : GL, color: G }}>
            {razonSocial}
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
                  boxShadow: active ? "0 1px 4px rgba(30,94,47,0.2)" : undefined,
                }}
              >
                {icon}
                {!collapsed && <span>{label}</span>}
              </button>
            )
          })}
        </nav>
        <div className="px-2 pb-4 border-t pt-2" style={{ borderColor: border }}>
          <button
            onClick={() => setShowLogout(true)}
            title={sidebarCollapsed && !inDrawer ? "Cerrar Sesión" : undefined}
            className="w-full flex items-center gap-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
            style={{ padding: collapsed ? "10px 0" : "10px 12px", justifyContent: collapsed ? "center" : undefined }}
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
      {mobileSidebarOpen && <div className="sidebar-overlay lg:hidden" onClick={() => setMobileSidebarOpen(false)} />}

      <div className={`sidebar-drawer lg:hidden ${mobileSidebarOpen ? "open" : ""}`} style={{ backgroundColor: sidebarBg, borderRight: `1px solid ${border}` }}>
        <SupplierSidebarContent inDrawer={true} />
      </div>

      <aside
        className="hidden lg:flex flex-col shrink-0 border-r relative transition-all duration-300"
        style={{ width: sidebarCollapsed ? 56 : 224, backgroundColor: sidebarBg, borderColor: border }}
      >
        <SupplierSidebarContent />
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full border flex items-center justify-center z-10 transition-all hover:scale-110"
          style={{ backgroundColor: sidebarBg, borderColor: border, color: sub }}
        >
          <svg className="w-3 h-3 transition-transform" style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="shrink-0 px-4 py-3 flex items-center gap-3 border-b" style={{ backgroundColor: card, borderColor: border }}>
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 rounded-xl transition-all hover:opacity-70 shrink-0" style={{ color: sub }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="lg:hidden shrink-0">
            <MunicipalSeal size={28} onClick={goHome} />
          </div>
          <div className="flex-1 hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-sm max-w-sm" style={{ backgroundColor: dark ? "#0F172A" : "#F9FAFB", borderColor: border }}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke={sub} viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder="Buscar solicitud o licitación..."
              defaultValue={q}
              onKeyDown={(e) => {
                if (e.key === "Enter") setQ((e.target as HTMLInputElement).value)
              }}
              className="bg-transparent outline-none text-sm flex-1 min-w-0"
              style={{ color: text }}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="relative p-2 rounded-xl transition-all hover:opacity-70" style={{ color: sub }}>
              <Icons.Bell />
              {noLeidas > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{noLeidas}</span>}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: border }}>
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 shrink-0 flex items-center justify-center text-white font-bold" style={{ borderColor: GB, backgroundColor: G }}>
                {(razonSocial[0] || "P").toUpperCase()}
              </div>
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold leading-none" style={{ color: text }}>{razonSocial}</p>
                <p className="text-[10px] mt-0.5" style={{ color: sub }}>NIT: {nit}</p>
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
                    <h1 className="text-2xl font-extrabold leading-tight" style={{ color: text }}>
                      Mis Oportunidades y Cotizaciones
                    </h1>
                    <p className="text-sm mt-1" style={{ color: sub }}>
                      Revise los requerimientos publicados por la Municipalidad de Panajachel y envíe sus proformas.
                    </p>
                  </div>
                  <button
                    onClick={() => recargar()}
                    className="hidden lg:flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all hover:bg-gray-50 shrink-0"
                    style={{ color: G, borderColor: "#D1D5DB" }}
                  >
                    <Icons.Refresh /> {loading ? "Cargando..." : "Actualizar"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {KPIS.map((k) => (
                    <div key={k.key} className="rounded-xl border p-5" style={{ backgroundColor: card, borderColor: border }}>
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>{k.label}</p>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: dark ? "rgba(30,94,47,0.25)" : GL, color: G }}>
                          {k.icon}
                        </div>
                      </div>
                      <p className="text-4xl font-extrabold font-mono" style={{ color: text }}>{k.value}</p>
                      <p className="text-xs font-semibold mt-1.5" style={{ color: k.subColor ?? sub }}>{k.sub2}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-5 items-start flex-wrap xl:flex-nowrap">
                  <div className="flex-1 min-w-0 rounded-xl border overflow-hidden" style={{ backgroundColor: card, borderColor: border }}>
                    <div className="px-5 pt-4 pb-0 border-b" style={{ borderColor: border }}>
                      <p className="text-base font-extrabold mb-3" style={{ color: text }}>Solicitudes de Compra</p>
                      <div className="flex gap-0 overflow-x-auto">
                        {TABS.map((t) => {
                          const active = tab === t.key
                          return (
                            <button
                              key={t.key}
                              onClick={() => setTab(t.key)}
                              className="relative px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                              style={{ color: active ? G : sub }}
                            >
                              {t.label}
                              {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ backgroundColor: G }} />}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {oportunidades.length === 0 ? (
                      <div className="px-5 py-12 text-center">
                        <p className="text-sm" style={{ color: sub }}>{loading ? "Cargando oportunidades..." : "No hay oportunidades en esta sección."}</p>
                      </div>
                    ) : (
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[540px]">
                          <thead>
                            <tr className="border-b" style={{ borderColor: border, backgroundColor: dark ? "#0F172A" : "#F9FAFB" }}>
                              {["NO. SOLICITUD", "DEPENDENCIA", "FECHA LÍMITE", "MONTO", "ESTADO", "ACCIONES"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {oportunidades.map((sol) => {
                              const es = ESTADO_BADGE[sol.estado] ?? { bg: "#F3F4F6", color: "#6B7280" }
                              return (
                                <tr key={sol.id_proceso} className="border-b transition-colors" style={{ borderColor: border }}>
                                  <td className="px-4 py-4">
                                    <p className="text-sm font-extrabold" style={{ color: G }}>{sol.codigo_requisicion}</p>
                                  </td>
                                  <td className="px-4 py-4">
                                    <p className="text-sm" style={{ color: text }}>{sol.dependencia}</p>
                                    <p className="text-[11px]" style={{ color: sub }}>{sol.tipo_solicitud}</p>
                                  </td>
                                  <td className="px-4 py-4">
                                    <p className="text-sm" style={{ color: sub }}>{fmtFecha(sol.fecha_limite)}</p>
                                  </td>
                                  <td className="px-4 py-4">
                                    <p className="text-sm font-bold font-mono" style={{ color: text }}>{sol.monto_total ? fmtQ(sol.monto_total) : "—"}</p>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: es.bg, color: es.color }}>{sol.estado}</span>
                                  </td>
                                  <td className="px-4 py-4">
                                    {esCotizable(sol) ? (
                                      <button
                                        onClick={() => abrirOportunidad(sol.id_proceso)}
                                        className="px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95"
                                        style={{ backgroundColor: G }}
                                      >
                                        Enviar Cotización
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          fireToast(
                                            sol.estado === "Adjudicada" ? "Orden de Compra" : "Mi Proforma",
                                            `Cargando documento de ${sol.codigo_requisicion}...`,
                                          )
                                        }
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all hover:opacity-80"
                                        style={{ color: G, borderColor: G }}
                                      >
                                        {sol.estado === "Adjudicada" ? "Ver Orden de Compra" : "Ver Mi Proforma"}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {oportunidades.length > 0 && (
                      <div className="md:hidden divide-y" style={{ borderColor: border }}>
                        {oportunidades.map((sol) => {
                          const es = ESTADO_BADGE[sol.estado] ?? { bg: "#F3F4F6", color: "#6B7280" }
                          return (
                            <div key={sol.id_proceso} className="p-4 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-extrabold" style={{ color: G }}>{sol.codigo_requisicion}</p>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: es.bg, color: es.color }}>{sol.estado}</span>
                              </div>
                              <p className="text-sm font-medium" style={{ color: text }}>{sol.dependencia} · {sol.tipo_solicitud}</p>
                              <div className="flex items-center justify-between text-xs" style={{ color: sub }}>
                                <span>Límite: {fmtFecha(sol.fecha_limite)}</span>
                                <span className="font-bold font-mono" style={{ color: text }}>{sol.monto_total ? fmtQ(sol.monto_total) : "—"}</span>
                              </div>
                              <div className="pt-1">
                                {esCotizable(sol) ? (
                                  <button onClick={() => abrirOportunidad(sol.id_proceso)} className="w-full py-2 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90 active:scale-95" style={{ backgroundColor: G }}>
                                    Enviar Cotización
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => fireToast(sol.estado === "Adjudicada" ? "Orden de Compra" : "Mi Proforma", `Cargando documento de ${sol.codigo_requisicion}...`)}
                                    className="w-full py-2 text-xs font-bold rounded-lg border-2 transition-all hover:opacity-80"
                                    style={{ color: G, borderColor: G }}
                                  >
                                    {sol.estado === "Adjudicada" ? "Ver Orden de Compra" : "Ver Mi Proforma"}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="w-full xl:w-64 shrink-0 rounded-xl border overflow-hidden" style={{ backgroundColor: card, borderColor: border }}>
                    <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: border }}>
                      <p className="text-sm font-extrabold" style={{ color: text }}>Carga Rápida de Factura FEL</p>
                      <p className="text-xs mt-0.5" style={{ color: sub }}>Envíe su factura electrónica directamente.</p>
                    </div>
                    <div className="p-5 space-y-4">
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingFEL(true) }}
                        onDragLeave={() => setIsDraggingFEL(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDraggingFEL(false); fireToast("Factura recibida", "El documento FEL fue enviado a revisión de pago.") }}
                        onClick={() => fireToast("Factura recibida", "El documento FEL fue enviado a revisión de pago.")}
                        className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-8 gap-2 cursor-pointer transition-all"
                        style={{ borderColor: isDraggingFEL ? G : dark ? "#334155" : "#CBD5E1", backgroundColor: isDraggingFEL ? (dark ? "rgba(30,94,47,0.15)" : "#F0FDF4") : dark ? "#0F172A" : "#F9FAFB" }}
                      >
                        <svg className="w-9 h-9" fill="none" stroke={isDraggingFEL ? G : sub} viewBox="0 0 24 24" strokeWidth={1.5}>
                          <polyline points="16 16 12 12 8 16" />
                          <line x1="12" y1="12" x2="12" y2="21" />
                          <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                        </svg>
                        <p className="text-xs text-center leading-snug font-semibold" style={{ color: sub }}>
                          Arrastre aquí su factura digital<br />(PDF / XML)
                        </p>
                      </div>
                      <button
                        onClick={() => fireToast("Factura enviada", "Tu factura FEL fue enviada a revisión de pago.")}
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
                <h1 className="text-2xl font-extrabold" style={{ color: text }}>Órdenes y Facturas</h1>
                <p className="text-sm" style={{ color: sub }}>Historial de órdenes de compra adjudicadas y estado de pago de sus facturas.</p>
                <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: card, borderColor: border }}>
                  {ordenes.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm" style={{ color: sub }}>No hay órdenes de compra.</p>
                  ) : (
                    ordenes.map((r) => {
                      const es = ORDEN_BADGE[r.estado] ?? { bg: "#F3F4F6", color: "#6B7280" }
                      return (
                        <div key={r.id_orden_compra} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 transition-colors" style={{ borderColor: border }}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: dark ? "rgba(30,94,47,0.25)" : GL, color: G }}>
                            <Icons.Doc />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold" style={{ color: text }}>{r.numero_orden}</p>
                            <p className="text-xs" style={{ color: sub }}>{r.codigo_requisicion} · {r.tipo_solicitud}</p>
                          </div>
                          <p className="text-sm font-extrabold font-mono" style={{ color: text }}>{fmtQ(r.monto_total)}</p>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: es.bg, color: es.color }}>{r.estado}</span>
                          <p className="text-xs" style={{ color: sub }}>{fmtFecha(r.fecha_emision)}</p>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {activeNav === "entregas" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-extrabold" style={{ color: text }}>Entregas en Bodega</h1>
                <p className="text-sm" style={{ color: sub }}>Programación y estado de sus entregas físicas en la bodega municipal.</p>
                <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: card, borderColor: border }}>
                  {entregas.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm" style={{ color: sub }}>No hay entregas registradas.</p>
                  ) : (
                    entregas.map((r) => {
                      const es = ENTREGA_BADGE[r.estado] ?? { bg: "#F3F4F6", color: "#6B7280" }
                      return (
                        <div key={r.id_recepcion} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 transition-colors" style={{ borderColor: border }}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: dark ? "rgba(30,94,47,0.25)" : GL, color: G }}>
                            <Icons.Bodega />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold" style={{ color: text }}>{r.numero_orden} · {r.numero_comprobante}</p>
                            <p className="text-xs" style={{ color: sub }}>{fmtFecha(r.fecha_recepcion)} · {r.total_items} ítem(s)</p>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: es.bg, color: es.color }}>{r.estado}</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {activeNav === "configuracion" && (
              <div className="space-y-5 max-w-lg">
                <h1 className="text-2xl font-extrabold" style={{ color: text }}>Configuración</h1>
                <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: card, borderColor: border }}>
                  <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: text }}>Modo Oscuro</p>
                      <p className="text-xs mt-0.5" style={{ color: sub }}>Cambia el tema del portal entre claro y oscuro.</p>
                    </div>
                    <button onClick={() => setDark((v) => !v)} role="switch" aria-checked={dark} className="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0" style={{ backgroundColor: dark ? G : "#D1D5DB" }}>
                      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300" style={{ transform: dark ? "translateX(24px)" : "translateX(0)" }} />
                    </button>
                  </div>
                  <div className="px-5 py-4 border-b" style={{ borderColor: border }}>
                    <p className="text-sm font-bold" style={{ color: text }}>Proveedor</p>
                    <p className="text-xs mt-0.5" style={{ color: sub }}>{razonSocial} · NIT: {nit}</p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm font-bold" style={{ color: text }}>Correo de Contacto</p>
                    <p className="text-xs mt-0.5" style={{ color: sub }}>{perfil?.correo ?? "—"}</p>
                  </div>
                </div>
                <button onClick={() => setShowLogout(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90" style={{ backgroundColor: "#DC2626" }}>
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
          style={{ backgroundColor: G, boxShadow: "0 4px 20px rgba(30,94,47,0.4)" }}
        >
          <Icons.Plus />
          <span className="hidden xs:inline">Subir Proforma</span>
        </button>
      )}

      {cotizarTarget && (
        <CotizarOportunidadModal
          detalle={cotizarTarget}
          dark={dark}
          onClose={cerrarCotizar}
          onToast={fireToast}
          onGuardar={guardarBorrador}
          onEnviar={enviar}
          onDeclinar={declinar}
          onSuccess={recargar}
        />
      )}
      {showSubir && <SubirProformaModal dark={dark} onClose={() => setShowSubir(false)} onToast={fireToast} />}
      {showLogout && (
        <CerrarSesionModal
          onClose={() => setShowLogout(false)}
          onConfirm={() => {
            setShowLogout(false)
            setTimeout(onLogout, 280)
          }}
        />
      )}

      <Toast show={toast.show} message={toast.message} sub={toast.sub} onHide={hideToast} />
    </div>
  )
}
