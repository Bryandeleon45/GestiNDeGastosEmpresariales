// ─── Notificaciones model ─────────────────────────────────────────────────────
export interface NotifItem {
  id: string
  icon: string
  title: string
  body: string
  time: string
  unread: boolean
  color: string
}

export const NOTIFS_DEFAULT: NotifItem[] = [
  {
    id: "n1",
    icon: "🧾",
    title: "Nueva solicitud recibida",
    body: "SOL-2024-047 de Oficina de Agua pendiente de aprobación.",
    time: "Hace 5 min",
    unread: true,
    color: "#1E5E2F",
  },
  {
    id: "n2",
    icon: "⚠️",
    title: "Stock crítico de Papel Bond",
    body: "Quedan solo 12 resmas. Por debajo del mínimo de 100.",
    time: "Hace 18 min",
    unread: true,
    color: "#DC2626",
  },
  {
    id: "n3",
    icon: "📄",
    title: "Factura pendiente de aprobación",
    body: "Factura #F-2024-129 de TecnoSupplies GT requiere firma.",
    time: "Hace 1 h",
    unread: true,
    color: "#D97706",
  },
  {
    id: "n4",
    icon: "✅",
    title: "Orden de compra procesada",
    body: "OC-2024-088 enviada correctamente al proveedor.",
    time: "Hace 2 h",
    unread: false,
    color: "#059669",
  },
  {
    id: "n5",
    icon: "📊",
    title: "Reporte mensual disponible",
    body: "Informe de gastos de mayo 2026 listo para descarga.",
    time: "Ayer",
    unread: false,
    color: "#6366F1",
  },
]
