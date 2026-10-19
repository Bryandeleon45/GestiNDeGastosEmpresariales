import { useState } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import MunicipalSeal from "@/components/common/MunicipalSeal"
import CerrarSesionModal from "@/views/common/CerrarSesionModal"
import Toast from "@/views/common/Toast"
import SubirProformaModal from "@/views/portal/SubirProformaModal"
import CotizarOportunidadModal from "@/views/portal/CotizarOportunidadModal"
import OportunidadDetalleModal from "@/views/portal/OportunidadDetalleModal"
import CargarFacturaModal from "@/views/portal/CargarFacturaModal"
import { useSupplierPortalController } from "@/controllers/useSupplierPortalController"
import NotificationBell from "@/views/dashboard/NotificationBell"
import { destinoPortal } from "@/models/notificaciones"
import {
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidasPortal,
  type Oportunidad,
  type PedidoAsignado,
} from "@/api/portal"

const NAV_PORTAL = [
  "oportunidades",
  "pedidos",
  "ordenes",
  "entregas",
  "configuracion",
] as const

const ESTADO_BADGE: Record<string, { bg: string; color: string }> = {
  Nueva: { bg: "#E0F2FE", color: "#0284C7" },
  Abierta: { bg: "#E0F2FE", color: "#0284C7" },
  Cotizada: { bg: "#DCFCE7", color: "#16A34A" },
  Adjudicada: { bg: "#22C55E", color: "#FFFFFF" },
  "No adjudicada": { bg: "#FEE2E2", color: "#DC2626" },
  Declinada: { bg: "var(--gray-100)", color: "#6B7280" },
  Vencida: { bg: "#FEF9C3", color: "#92400E" },
  Cancelada: { bg: "var(--gray-100)", color: "#6B7280" },
  Cerrada: { bg: "var(--gray-100)", color: "#6B7280" },
}

const ORDEN_BADGE: Record<string, { bg: string; color: string }> = {
  Pendiente: { bg: "var(--gray-100)", color: "#6B7280" },
  Aprobada: { bg: "#DBEAFE", color: "#2563EB" },
  Enviada: { bg: "#FEF3C7", color: "#B45309" },
  Entregada: { bg: "#DCFCE7", color: "#16A34A" },
  Cancelada: { bg: "#FEE2E2", color: "#DC2626" },
}

const FACTURA_BADGE: Record<string, { bg: string; color: string }> = {
  Recibida: { bg: "#DBEAFE", color: "#2563EB" },
  "En Revision": { bg: "#FEF3C7", color: "#B45309" },
  Aprobada: { bg: "#DCFCE7", color: "#16A34A" },
  Rechazada: { bg: "#FEE2E2", color: "#DC2626" },
}

const ENTREGA_BADGE: Record<string, { bg: string; color: string }> = {
  Completa: { bg: "#DCFCE7", color: "#16A34A" },
  Parcial: { bg: "#FEF9C3", color: "#92400E" },
  "Con Novedades": { bg: "#FEF9C3", color: "#92400E" },
  "En Proceso": { bg: "#E0F2FE", color: "#0284C7" },
  Cancelada: { bg: "#FEE2E2", color: "#DC2626" },
}

const INFORME_ESTADO_BADGE: Record<string, { bg: string; color: string }> = {
  "Pagada y recibida": { bg: "#DCFCE7", color: "#16A34A" },
  Pagada: { bg: "#DBEAFE", color: "#2563EB" },
  "Pendiente de pago": { bg: "#FEF3C7", color: "#B45309" },
  "Pendiente de factura": { bg: "var(--gray-100)", color: "#6B7280" },
}

const fmtQ = (n: number | string) =>
  `Q ${Number(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

const fmtQ0 = (n: number | string) => (Number(n || 0) > 0 ? fmtQ(n) : "—")

const fmtFecha = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-GT") : "—"

const fmtHora = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }) : "—"

const esCotizable = (o: Oportunidad) =>
  o.fase === "Publicada" && (o.estado === "Nueva" || o.estado === "Abierta")

const PEDIDO_BADGE: Record<string, { bg: string; color: string }> = {
  Asignado: { bg: "#E0F2FE", color: "#0284C7" },
  "En Camino": { bg: "#FEF9C3", color: "#92400E" },
  Entregado: { bg: "#DCFCE7", color: "#16A34A" },
  Cancelado: { bg: "#FEE2E2", color: "#DC2626" },
}

function PdfViewerModal({
  src,
  nombre,
  onClose,
  dark,
}: {
  src: string
  nombre: string
  onClose: () => void
  dark: boolean
}) {
  const border = dark ? "#334155" : "#E5E7EB"
  const text = dark ? "var(--gray-100)" : "#1F2937"
  const sub = dark ? "#94A3B8" : "#6B7280"

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(2px)" }}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: dark ? "#1E293B" : "#FFFFFF", animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: border }}>
          <div className="flex items-center gap-3 min-w-0">
            <Icons.PDF />
            <span className="text-sm font-bold truncate" style={{ color: text }}>{nombre}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all shrink-0" style={{ color: sub }}>
            <Icons.X />
          </button>
        </div>
        <div className="flex-1 overflow-hidden" style={{ backgroundColor: dark ? "#0F172A" : "var(--gray-100)" }}>
          <iframe
            src={src}
            className="w-full h-full border-0"
            title={nombre}
          />
        </div>
      </div>
    </div>
  )
}

function PedidoDetalleModal({
  pedido,
  onClose,
  dark,
}: {
  pedido: PedidoAsignado
  onClose: () => void
  dark: boolean
}) {
  const [pdfViewer, setPdfViewer] = useState<{ src: string; nombre: string } | null>(null)
  const es = PEDIDO_BADGE[pedido.estado] ?? { bg: "var(--gray-100)", color: "#6B7280" }
  const card = dark ? "#1E293B" : "#FFFFFF"
  const border = dark ? "#334155" : "#E5E7EB"
  const text = dark ? "var(--gray-100)" : "#1F2937"
  const sub = dark ? "#94A3B8" : "#6B7280"

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.52)", backdropFilter: "blur(1px)" }}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        style={{ backgroundColor: card, animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: border }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: text }}>{pedido.codigo_requisicion}</h2>
            <p className="text-xs" style={{ color: sub }}>{pedido.dependencia} · {pedido.tipo_solicitud}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: es.bg, color: es.color }}>
              {pedido.estado}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-all" style={{ color: sub }}>
              <Icons.X />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border p-3" style={{ borderColor: border }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Dependencia</p>
              <p className="text-sm font-semibold mt-1" style={{ color: text }}>{pedido.dependencia}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: border }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Lugar de Entrega</p>
              <p className="text-sm font-semibold mt-1" style={{ color: text }}>{pedido.lugar_entrega ?? "—"}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: border }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Fecha del Pedido</p>
              <p className="text-sm font-semibold mt-1" style={{ color: text }}>{fmtFecha(pedido.fecha_solicitud)}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: border }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Fecha de Asignación</p>
              <p className="text-sm font-semibold mt-1" style={{ color: text }}>{fmtFecha(pedido.fecha_asignacion)}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: sub }}>Ítems del Pedido</p>
            <div className="rounded-xl border divide-y" style={{ borderColor: border, backgroundColor: dark ? "#0F172A" : "var(--gray-50)" }}>
              {pedido.items.map((it) => (
                <div key={it.id_detalle} className="px-4 py-3">
                  <p className="text-sm font-semibold" style={{ color: text }}>{it.descripcion}</p>
                  <p className="text-xs mt-0.5" style={{ color: sub }}>
                    {Number(it.cantidad).toLocaleString("es-GT")} {it.unidad}
                    {it.observaciones ? ` · ${it.observaciones}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: sub }}>Justificación</p>
            <p className="text-sm rounded-lg border p-3" style={{ color: text, borderColor: border, backgroundColor: dark ? "#0F172A" : "var(--gray-50)" }}>
              {pedido.justificacion}
            </p>
          </div>

          {pedido.documentos.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: sub }}>
                Documentos Adjuntos ({pedido.documentos.length})
              </p>
              <div className="space-y-2">
                {pedido.documentos.map((doc, i) => (
                  <button key={i} onClick={() => setPdfViewer({ src: doc.contenido_base64, nombre: doc.nombre_archivo })} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors rounded-lg border text-left" style={{ borderColor: border }}>
                    <Icons.PDF />
                    <span className="flex-1 min-w-0 text-left text-sm font-medium truncate" style={{ color: text }}>
                      {doc.nombre_archivo}
                    </span>
                    <Icons.ArrowRight className="shrink-0" style={{ color: G }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {pdfViewer && (
          <PdfViewerModal
            src={pdfViewer.src}
            nombre={pdfViewer.nombre}
            onClose={() => setPdfViewer(null)}
            dark={dark}
          />
        )}
      </div>
    </div>
  )
}

function PedidosAsignadosSection({
  pedidos,
  dark,
  card,
  border,
  text,
  sub,
  onVerDetalle,
}: {
  pedidos: PedidoAsignado[]
  dark: boolean
  card: string
  border: string
  text: string
  sub: string
  onVerDetalle: (p: PedidoAsignado) => void
}) {
  const [pdfViewer, setPdfViewer] = useState<{ src: string; nombre: string } | null>(null)
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: text }}>Pedidos Asignados</h1>
        <p className="text-sm" style={{ color: sub }}>
          Pedidos que la Municipalidad le ha asignado directamente. Revise la información y prepare la entrega.
        </p>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: card, borderColor: border }}>
          <p className="px-5 py-12 text-center text-sm" style={{ color: sub }}>
            No hay pedidos asignados por el momento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
                  {pedidos.map((p) => {
            const es = PEDIDO_BADGE[p.estado] ?? { bg: "var(--gray-100)", color: "#6B7280" }
            const esEntregado = p.estado === "Entregado"
            return (
              <div
                key={p.id_requisicion}
                onClick={() => onVerDetalle(p)}
                className="rounded-xl border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                style={{
                  backgroundColor: esEntregado ? (dark ? "#052e16" : "#f0fdf4") : card,
                  borderColor: esEntregado ? "#22c55e" : border,
                }}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: esEntregado ? "#22c55e" : dark ? "rgba(30,94,47,0.25)" : "#DCEEFE",
                      color: esEntregado ? "#ffffff" : G,
                    }}
                  >
                    <Icons.PackagePlus />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: esEntregado ? "#15803d" : text }}>{p.codigo_requisicion}</p>
                    <p className="text-xs truncate" style={{ color: esEntregado ? "#16a34a" : sub }}>
                      {p.dependencia} · {p.tipo_solicitud}
                    </p>
                  </div>
                  <p className="text-sm font-extrabold font-mono" style={{ color: esEntregado ? "#15803d" : text }}>{p.monto_estimado}</p>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: es.bg, color: es.color }}>
                    {p.estado}
                  </span>
                </div>

                <div className="border-t px-5 py-4 space-y-4" style={{ borderColor: border }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3" style={{ borderColor: border }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Dependencia</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: text }}>{p.dependencia}</p>
                    </div>
                    <div className="rounded-lg border p-3" style={{ borderColor: border }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Lugar de Entrega</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: text }}>{p.lugar_entrega ?? "—"}</p>
                    </div>
                    <div className="rounded-lg border p-3" style={{ borderColor: border }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Fecha del Pedido</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: text }}>{fmtFecha(p.fecha_solicitud)}</p>
                    </div>
                    <div className="rounded-lg border p-3" style={{ borderColor: border }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Fecha de Asignación</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: text }}>{fmtFecha(p.fecha_asignacion)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: sub }}>Ítems del Pedido</p>
                    <div className="rounded-xl border divide-y" style={{ borderColor: border, backgroundColor: dark ? "#0F172A" : "var(--gray-50)" }}>
                      {p.items.map((it) => (
                        <div key={it.id_detalle} className="px-4 py-3">
                          <p className="text-sm font-semibold" style={{ color: text }}>{it.descripcion}</p>
                          <p className="text-xs mt-0.5" style={{ color: sub }}>
                            {Number(it.cantidad).toLocaleString("es-GT")} {it.unidad}
                            {it.observaciones ? ` · ${it.observaciones}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: sub }}>Justificación</p>
                    <p className="text-sm rounded-lg border p-3" style={{ color: text, borderColor: border, backgroundColor: dark ? "#0F172A" : "var(--gray-50)" }}>
                      {p.justificacion}
                    </p>
                  </div>

                  {p.documentos.length > 0 && (
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: sub }}>
                        Documentos Adjuntos ({p.documentos.length})
                      </p>
                      <div className="space-y-2">
                        {p.documentos.map((doc, i) => (
                          <button key={i} onClick={() => setPdfViewer({ src: doc.contenido_base64, nombre: doc.nombre_archivo })} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors rounded-lg border text-left" style={{ borderColor: border }}>
                            <Icons.PDF />
                            <span className="flex-1 min-w-0 text-left text-sm font-medium truncate" style={{ color: text }}>
                              {doc.nombre_archivo}
                            </span>
                            <Icons.ArrowRight className="shrink-0" style={{ color: G }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {pdfViewer && (
            <PdfViewerModal
              src={pdfViewer.src}
              nombre={pdfViewer.nombre}
              onClose={() => setPdfViewer(null)}
              dark={dark}
            />
          )}
        </div>
      )}
    </div>
  )
}

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
    pedidosAsignados,
    facturas,
    ordenesFacturables,
    facturaTargetOC,
    setFacturaTargetOC,
    cargarOrdenesFacturables,
    informe,
    informeTotales,
    informeFiltros,
    setInformeFiltros,
    cargarInforme,
    exportarInforme,
    loading,
    showCargarFactura,
    setShowCargarFactura,
    cargarFacturas,
    cargarOrdenes,
    recargar,
    abrirOportunidad,
    cotizarTarget,
    cerrarCotizar,
    verOportunidad,
    detalleTarget,
    cerrarDetalle,
    guardarBorrador,
    enviar,
    declinar,
  } = useSupplierPortalController()

  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoAsignado | null>(null)

  const [fi, setFi] = useState("")
  const [ff, setFf] = useState("")
  const [estadoF, setEstadoF] = useState("")

  const aplicarInforme = () => {
    const f: Record<string, string> = {}
    if (fi) f.fechaInicio = fi
    if (ff) f.fechaFin = ff
    if (estadoF) f.estado = estadoF
    setInformeFiltros(f)
    cargarInforme(f)
  }

  const bg = dark ? "#0F172A" : "var(--gray-50)"
  const card = dark ? "#1E293B" : "#FFFFFF"
  const border = dark ? "#334155" : "var(--gray-100)"
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
    { key: "pedidos" as const, label: "Pedidos Asignados", icon: <Icons.PackagePlus /> },
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
          <div className="flex-1 hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-sm max-w-sm" style={{ backgroundColor: dark ? "#0F172A" : "var(--gray-50)", borderColor: border }}>
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
            <NotificationBell
              onNavegar={(nav) => {
                if ((NAV_PORTAL as readonly string[]).includes(nav))
                  setActiveNav(nav as (typeof NAV_PORTAL)[number])
              }}
              obtener={listarNotificaciones}
              marcarUna={marcarNotificacionLeida}
              marcarTodas={marcarTodasLeidasPortal}
              destino={destinoPortal}
              verTodas={null}
              tema={dark ? "oscuro" : "claro"}
            />
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
                            <tr className="border-b" style={{ borderColor: border, backgroundColor: dark ? "#0F172A" : "var(--gray-50)" }}>
                              {["NO. SOLICITUD", "DEPENDENCIA", "FECHA LÍMITE", "MONTO", "ESTADO", "ACCIONES"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {oportunidades.map((sol) => {
                              const es = ESTADO_BADGE[sol.estado] ?? { bg: "var(--gray-100)", color: "#6B7280" }
                              return (
                                <tr key={sol.id_proceso} className="border-b transition-colors" style={{ borderColor: border }}>
                                  <td className="px-4 py-4">
                                    <button
                                      onClick={() => verOportunidad(sol.id_proceso)}
                                      className="text-sm font-extrabold text-left hover:underline transition-all"
                                      style={{ color: G }}
                                    >
                                      {sol.codigo_requisicion}
                                    </button>
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
                          const es = ESTADO_BADGE[sol.estado] ?? { bg: "var(--gray-100)", color: "#6B7280" }
                          return (
                            <div key={sol.id_proceso} className="p-4 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <button
                                  onClick={() => verOportunidad(sol.id_proceso)}
                                  className="text-sm font-extrabold text-left hover:underline transition-all"
                                  style={{ color: G }}
                                >
                                  {sol.codigo_requisicion}
                                </button>
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


                </div>
              </>
            )}

            {activeNav === "pedidos" && (
              <PedidosAsignadosSection
                pedidos={pedidosAsignados}
                dark={dark}
                card={card}
                border={border}
                text={text}
                sub={sub}
                onVerDetalle={setPedidoDetalle}
              />
            )}

            {activeNav === "ordenes" && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-extrabold" style={{ color: text }}>Órdenes y Facturas</h1>
                    <p className="text-sm" style={{ color: sub }}>
                      Todas sus órdenes de compra y su estado de facturación. Seleccione una orden pendiente para cargar y enviar su factura.
                    </p>
                  </div>
                  <button
                    onClick={() => { setFacturaTargetOC(null); setShowCargarFactura(true) }}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: G }}
                  >
                    <Icons.Plus /> Cargar Factura
                  </button>
                </div>

                <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: card, borderColor: border }}>
                  <div className="px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: border }}>
                    <h2 className="text-base font-bold" style={{ color: G }}>Órdenes de compra</h2>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--gray-100)", color: "#6B7280" }}>
                      {ordenesFacturables.length} {ordenesFacturables.length === 1 ? "orden" : "órdenes"}
                    </span>
                  </div>
                  {ordenesFacturables.length === 0 ? (
                    <div className="px-5 py-14 flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: dark ? "rgba(30,94,47,0.25)" : "#EEF2F6", color: sub }}>
                        <Icons.Doc />
                      </div>
                      <p className="text-sm font-bold" style={{ color: text }}>Aún no tiene órdenes de compra asignadas</p>
                      <p className="text-xs max-w-md" style={{ color: sub }}>
                        Cuando se le adjudique una orden, aparecerá aquí para que pueda recepcionarla en bodega y cargar su factura.
                      </p>
                      <button
                        onClick={() => { setFacturaTargetOC(null); setShowCargarFactura(true) }}
                        className="mt-1 flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90"
                        style={{ backgroundColor: G }}
                      >
                        <Icons.Plus /> Cargar Factura
                      </button>
                    </div>
                  ) : (
                    ordenesFacturables.map((o) => {
                      const disponible = Number(o.recibido_valorizado) - Number(o.total_facturado)
                      const facturado = Number(o.total_facturado)
                      const pendiente = disponible > 0
                      const estadoLabel = pendiente ? "Pendiente" : facturado > 0 ? "Facturada" : "Sin recepción"
                      const monto = pendiente ? fmtQ0(disponible) : facturado > 0 ? fmtQ0(facturado) : fmtQ0(Number(o.monto_total))
                      const montoCaption = pendiente ? "disponible" : facturado > 0 ? "facturado" : "total orden"
                      return (
                        <button
                          key={o.id_orden_compra}
                          onClick={() => {
                            if (!pendiente) return
                            setFacturaTargetOC(o.id_orden_compra)
                            setShowCargarFactura(true)
                          }}
                          className={`w-full flex items-center gap-4 px-5 py-4 border-b last:border-b-0 text-left ${pendiente ? "transition-colors hover:bg-gray-50/60 cursor-pointer" : "cursor-default"}`}
                          style={{ borderColor: border, opacity: 0.65, filter: "grayscale(1)" }}
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: dark ? "rgba(30,94,47,0.25)" : "#EEF2F6", color: sub }}>
                            <Icons.Doc />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold" style={{ color: sub }}>{o.numero_orden}</p>
                            <p className="text-xs" style={{ color: sub }}>{o.codigo_requisicion} · {o.tipo_solicitud}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-extrabold font-mono" style={{ color: sub }}>{monto}</p>
                            <p className="text-[10px]" style={{ color: sub, opacity: 0.7 }}>{montoCaption}</p>
                          </div>
                          {o.es_proforma && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>Proforma</span>
                          )}
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                            style={{
                              backgroundColor: pendiente ? "#FEF3C7" : "var(--gray-100)",
                              color: pendiente ? "#D97706" : "#6B7280",
                            }}
                          >
                            {estadoLabel}
                          </span>
                          <p className="text-xs" style={{ color: sub }}>{fmtFecha(o.fecha_emision)}</p>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {activeNav === "entregas" && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-extrabold" style={{ color: text }}>Entregas en Bodega</h1>
                    <p className="text-sm mt-1" style={{ color: sub }}>
                      Estado consolidado de sus solicitudes: recepción en bodega, facturación y pago.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportarInforme("csv")}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border transition-all hover:opacity-80"
                      style={{ color: G, borderColor: G }}
                    >
                      <Icons.Download /> Exportar CSV
                    </button>
                    <button
                      onClick={() => exportarInforme("pdf")}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90"
                      style={{ backgroundColor: G }}
                    >
                      <Icons.Download /> Exportar PDF
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                  {[
                    { label: "ÓRDENES", value: String(informeTotales?.ordenes ?? 0), color: G, icon: <Icons.Doc /> },
                    { label: "MONTO TOTAL", value: fmtQ0(informeTotales?.monto_orden ?? 0), color: "#0EA5E9", icon: <Icons.Wallet /> },
                    { label: "RECIBIDO EN BODEGA", value: fmtQ0(informeTotales?.recibido ?? 0), color: "#16A34A", icon: <Icons.Bodega /> },
                    { label: "PAGADO", value: fmtQ0(informeTotales?.pagado ?? 0), color: "#D97706", icon: <Icons.CheckBadge /> },
                    { label: "PENDIENTES", value: String(informeTotales?.pendientes ?? 0), color: "#DC2626", icon: <Icons.Solicitudes /> },
                  ].map((k) => (
                    <div key={k.label} className="rounded-xl border p-4" style={{ backgroundColor: card, borderColor: border }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: dark ? "rgba(30,94,47,0.25)" : GL, color: k.color }}>
                          {k.icon}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider leading-tight" style={{ color: sub }}>{k.label}</p>
                      </div>
                      <p className="text-xl font-extrabold font-mono leading-none" style={{ color: text }}>{k.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-end gap-3 flex-wrap">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: sub }}>Desde</label>
                    <input type="date" value={fi} onChange={(e) => setFi(e.target.value)} className="px-3 py-2 text-sm rounded-lg border outline-none" style={{ backgroundColor: card, borderColor: border, color: text }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: sub }}>Hasta</label>
                    <input type="date" value={ff} onChange={(e) => setFf(e.target.value)} className="px-3 py-2 text-sm rounded-lg border outline-none" style={{ backgroundColor: card, borderColor: border, color: text }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: sub }}>Estado</label>
                    <select value={estadoF} onChange={(e) => setEstadoF(e.target.value)} className="px-3 py-2 text-sm rounded-lg border outline-none min-w-[160px]" style={{ backgroundColor: card, borderColor: border, color: text }}>
                      <option value="">Todas</option>
                      <option value="pagadas">Pagadas</option>
                      <option value="recibidas">Recibidas en bodega</option>
                      <option value="pendientes">Pendientes de pago</option>
                    </select>
                  </div>
                  <button onClick={aplicarInforme} className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90" style={{ backgroundColor: G }}>
                    Aplicar
                  </button>
                </div>

                <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: card, borderColor: border }}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                      <thead>
                        <tr className="border-b" style={{ borderColor: border, backgroundColor: dark ? "#0F172A" : "var(--gray-50)" }}>
                          {["SOLICITUD", "DEPENDENCIA", "ORDEN", "MONTO", "RECIBIDO", "FACTURADO", "PAGADO", "ESTADO"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap" style={{ color: sub }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {informe.length === 0 ? (
                          <tr><td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: sub }}>Sin solicitudes para los filtros aplicados.</td></tr>
                        ) : (
                          informe.map((f) => {
                            const es = INFORME_ESTADO_BADGE[f.estado] ?? { bg: "var(--gray-100)", color: "#6B7280" }
                            return (
                              <tr key={f.id_orden_compra} className="border-b transition-colors" style={{ borderColor: border }}>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-extrabold" style={{ color: G }}>{f.codigo_requisicion}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm" style={{ color: text }}>{f.dependencia}</p>
                                  <p className="text-[11px]" style={{ color: sub }}>{f.tipo_solicitud}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-xs font-mono" style={{ color: text }}>{f.numero_orden}</p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <p className="text-sm font-bold font-mono" style={{ color: text }}>{fmtQ0(f.monto_orden)}</p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <p className="text-sm font-mono" style={{ color: text }}>{fmtQ0(f.recibido_valorizado)}</p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <p className="text-sm font-mono" style={{ color: text }}>{fmtQ0(f.facturado)}</p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <p className="text-sm font-mono" style={{ color: text }}>{fmtQ0(f.pagado)}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ backgroundColor: es.bg, color: es.color }}>{f.estado}</span>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
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
      {showCargarFactura && (
        <CargarFacturaModal
          initialIdOC={facturaTargetOC}
          nit={nit}
          onClose={() => { setShowCargarFactura(false); setFacturaTargetOC(null) }}
          onToast={fireToast}
          onSuccess={() => {
            cargarFacturas()
            cargarOrdenes()
            cargarOrdenesFacturables()
            cargarInforme()
            setFacturaTargetOC(null)
          }}
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

      {pedidoDetalle && (
        <PedidoDetalleModal
          pedido={pedidoDetalle}
          onClose={() => setPedidoDetalle(null)}
          dark={dark}
        />
      )}

      {detalleTarget && (
        <OportunidadDetalleModal
          detalle={detalleTarget}
          onClose={cerrarDetalle}
          dark={dark}
        />
      )}

      <Toast show={toast.show} message={toast.message} sub={toast.sub} onHide={hideToast} />
    </div>
  )
}
