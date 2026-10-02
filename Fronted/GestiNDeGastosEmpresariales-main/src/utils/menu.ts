import type { ReactElement } from "react"
import { Icons } from "@/components/common/Icons"
import type { MenuItem } from "@/api/auth"

export interface NavItem {
  key: string
  label: string
  Icon: () => ReactElement
}

const CONTROLADOR_MAP: Record<string, { key: string; label: string; Icon: () => ReactElement }> = {
  dashboard: { key: "dashboard", label: "Dashboard", Icon: Icons.Dashboard },
  solicitudes: { key: "dependencias", label: "Dependencias", Icon: Icons.Dependencias },
  proveedores: { key: "proveedores", label: "Proveedores", Icon: Icons.Proveedores },
  proformas: { key: "proformas", label: "Proformas", Icon: Icons.Proformas },
  facturacion: { key: "facturacion", label: "Facturación", Icon: Icons.Facturacion },
  bodega: { key: "bodega", label: "Bodega", Icon: Icons.Bodega },
  reportes: { key: "reportes", label: "Reportes", Icon: Icons.Reportes },
  usuarios: { key: "usuarios", label: "Usuarios", Icon: Icons.Users },
  configuracion: { key: "configuracion", label: "Configuración", Icon: Icons.Config },
  roles: { key: "roles", label: "Roles", Icon: Icons.Shield },
  auditoria: { key: "bitacora", label: "Bitácora", Icon: Icons.Activity },
}

export function flattenMenu(menu: MenuItem[]): NavItem[] {
  const items: NavItem[] = []
  for (const m of menu) {
    for (const s of m.submenus) {
      const mapped = CONTROLADOR_MAP[s.controlador]
      if (mapped) {
        items.push({ key: mapped.key, label: mapped.label, Icon: mapped.Icon })
      }
    }
  }
  return items
}
