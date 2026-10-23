// ─── Notificaciones model ─────────────────────────────────────────────────────
// Estilo y destino de cada tipo de notificación que emite el backend.
// `nav` es la vista del admin a la que lleva al hacer clic.
import { fmtFecha } from "@/utils/fechas"

export interface NotifEstilo {
  color: string
  nav?: string
}

export const ESTILO_POR_TIPO: Record<string, NotifEstilo> = {
  NUEVA_SOLICITUD: { color: "#1E5E2F", nav: "dependencias" },
  ESTADO_SOLICITUD: { color: "#059669", nav: "dependencias" },
  STOCK_BAJO: { color: "#DC2626", nav: "bodega" },
  NUEVA_COTIZACION: { color: "#6366F1", nav: "proformas" },
  COTIZACION_RECIBIDA: { color: "#6366F1", nav: "proformas" },
  ASIGNACION_PROVEEDOR: { color: "#0891B2", nav: "proformas" },
  NUEVA_ORDEN: { color: "#059669", nav: "proformas" },
  PROFORMA_RECHAZADA: { color: "#DC2626", nav: "proformas" },
  FACTURA_RECIBIDA: { color: "#D97706", nav: "facturacion" },
  FACTURA_REVISADA: { color: "#D97706", nav: "facturacion" },
  FACTURA_POR_VENCER: { color: "#D97706", nav: "facturacion" },
  FACTURA_VENCIDA: { color: "#DC2626", nav: "facturacion" },
  NUEVA_OPORTUNIDAD: { color: "#16A34A", nav: "proformas" },
  PROCESO_DESIERTO: { color: "#DC2626", nav: "proformas" },
  OPORTUNIDAD_DECLINADA: { color: "#D97706", nav: "proformas" },
}

export const ESTILO_POR_DEFECTO: NotifEstilo = {
  color: "#6B7280",
  nav: "dashboard",
}

export function estiloDe(tipo: string): NotifEstilo {
  return ESTILO_POR_TIPO[tipo] ?? ESTILO_POR_DEFECTO
}

// Destino de cada tipo de notificación dentro del PORTAL de proveedores
// (las secciones del sidebar del portal, no las vistas del admin).
export const DESTINO_PORTAL: Record<string, string> = {
  ASIGNACION_PROVEEDOR: "pedidos",
  NUEVA_ORDEN: "ordenes",
  FACTURA_REVISADA: "ordenes",
  PROFORMA_RECHAZADA: "oportunidades",
  COTIZACION_RECIBIDA: "oportunidades",
  NUEVA_OPORTUNIDAD: "oportunidades",
  PROCESO_DESIERTO: "oportunidades",
}

export function destinoPortal(tipo: string): string {
  return DESTINO_PORTAL[tipo] ?? "oportunidades"
}

// Tiempo relativo real ("Hace 5 min") a partir de la fecha del servidor.
export function tiempoRelativo(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ""
  const seg = Math.floor((Date.now() - fecha.getTime()) / 1000)
  if (seg < 60) return "Hace un momento"
  const min = Math.floor(seg / 60)
  if (min < 60) return `Hace ${min} min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `Hace ${hrs} h`
  const dias = Math.floor(hrs / 24)
  if (dias === 1) return "Ayer"
  if (dias < 7) return `Hace ${dias} días`
  return fmtFecha(iso)
}
