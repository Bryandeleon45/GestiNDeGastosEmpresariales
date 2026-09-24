// ─── Auditoría model ──────────────────────────────────────────────────────────
import type { ComponentType } from "react"
import { Icons } from "@/components/common/Icons"

export interface AuditEntry {
  fecha: string
  usuario: string
  actividad: string
  actividadColor: "green" | "gray"
  descripcion: string
  estado: string
  estadoStyle: string
  EstadoIcon: ComponentType
}

export const PAGE_SIZE = 5

export const ALL_AUDIT: AuditEntry[] = [
  {
    fecha: "11/06/2026 22:40:43",
    usuario: "A. Reyes",
    actividad: "SC-2024-045 (Oficina)",
    actividadColor: "green",
    descripcion: "Orden de compra procesada y enviada a proveedor.",
    estado: "Procesado",
    estadoStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    EstadoIcon: Icons.CheckBadge,
  },
  {
    fecha: "11/06/2026 22:40:43",
    usuario: "(System)",
    actividad: "SC-2024-044 (Agua)",
    actividadColor: "green",
    descripcion: "Solicitud aprobada automáticamente por sistema.",
    estado: "Auto-Aprobado",
    estadoStyle: "bg-green-50 text-green-700 border border-green-200",
    EstadoIcon: Icons.Zap,
  },
  {
    fecha: "10/06/2026 16:01",
    usuario: "A. Reyes",
    actividad: "(General)",
    actividadColor: "gray",
    descripcion: "Presupuesto anual actualizado al 64%.",
    estado: "Actualizado",
    estadoStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    EstadoIcon: Icons.Refresh,
  },
  {
    fecha: "10/06/2026 09:44",
    usuario: "J. Pérez",
    actividad: "SC-2024-042 (Cloro)",
    actividadColor: "green",
    descripcion: "Solicitud creada por Oficina de Agua.",
    estado: "Creado",
    estadoStyle: "bg-amber-50 text-amber-700 border border-amber-200",
    EstadoIcon: Icons.Pencil,
  },
  {
    fecha: "09/06/2026 11:20",
    usuario: "(System)",
    actividad: "SC-2024-040 (Papelería)",
    actividadColor: "green",
    descripcion: "Solicitud guardada como borrador.",
    estado: "Guardado",
    estadoStyle: "bg-gray-100 text-gray-600 border border-gray-200",
    EstadoIcon: Icons.Doc,
  },
  {
    fecha: "09/06/2026 08:15",
    usuario: "M. López",
    actividad: "SC-2024-039 (Limpieza)",
    actividadColor: "green",
    descripcion: "Proveedor asignado a orden de limpieza.",
    estado: "Procesado",
    estadoStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    EstadoIcon: Icons.CheckBadge,
  },
  {
    fecha: "08/06/2026 17:30",
    usuario: "A. Reyes",
    actividad: "SC-2024-038 (Oficina)",
    actividadColor: "green",
    descripcion: "Factura #F-2024-128 aprobada y registrada.",
    estado: "Procesado",
    estadoStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    EstadoIcon: Icons.CheckBadge,
  },
  {
    fecha: "08/06/2026 14:22",
    usuario: "(System)",
    actividad: "(General)",
    actividadColor: "gray",
    descripcion: "Alerta de stock bajo generada automáticamente.",
    estado: "Auto-Aprobado",
    estadoStyle: "bg-green-50 text-green-700 border border-green-200",
    EstadoIcon: Icons.Zap,
  },
  {
    fecha: "07/06/2026 11:05",
    usuario: "J. Pérez",
    actividad: "SC-2024-036 (Agua)",
    actividadColor: "green",
    descripcion: "Solicitud de mantenimiento enviada a bodega.",
    estado: "Creado",
    estadoStyle: "bg-amber-50 text-amber-700 border border-amber-200",
    EstadoIcon: Icons.Pencil,
  },
  {
    fecha: "07/06/2026 09:00",
    usuario: "R. Castro",
    actividad: "SC-2024-035 (Cultura)",
    actividadColor: "green",
    descripcion: "Presupuesto aprobado por Director Financiero.",
    estado: "Actualizado",
    estadoStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    EstadoIcon: Icons.Refresh,
  },
  {
    fecha: "06/06/2026 16:45",
    usuario: "M. López",
    actividad: "SC-2024-034 (Obras)",
    actividadColor: "green",
    descripcion: "Orden de compra enviada a proveedor externo.",
    estado: "Procesado",
    estadoStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    EstadoIcon: Icons.CheckBadge,
  },
  {
    fecha: "06/06/2026 13:10",
    usuario: "A. Reyes",
    actividad: "SC-2024-033 (Oficina)",
    actividadColor: "green",
    descripcion: "Informe mensual de gastos generado.",
    estado: "Actualizado",
    estadoStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    EstadoIcon: Icons.Refresh,
  },
  {
    fecha: "05/06/2026 10:30",
    usuario: "(System)",
    actividad: "SC-2024-032 (DAFIM)",
    actividadColor: "green",
    descripcion: "Cierre automático de solicitud vencida.",
    estado: "Guardado",
    estadoStyle: "bg-gray-100 text-gray-600 border border-gray-200",
    EstadoIcon: Icons.Doc,
  },
  {
    fecha: "05/06/2026 08:55",
    usuario: "J. Pérez",
    actividad: "SC-2024-031 (Agua)",
    actividadColor: "green",
    descripcion: "Nueva solicitud registrada por Oficina de Agua.",
    estado: "Creado",
    estadoStyle: "bg-amber-50 text-amber-700 border border-amber-200",
    EstadoIcon: Icons.Pencil,
  },
  {
    fecha: "04/06/2026 15:20",
    usuario: "R. Castro",
    actividad: "(General)",
    actividadColor: "gray",
    descripcion: "Configuración del sistema actualizada.",
    estado: "Actualizado",
    estadoStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    EstadoIcon: Icons.Refresh,
  },
]

export const TIPO_OPTIONS = [
  "Todas las actividades",
  "Orden de Compra",
  "Aprobación",
  "Actualización",
  "Creación",
  "Borrador",
]
