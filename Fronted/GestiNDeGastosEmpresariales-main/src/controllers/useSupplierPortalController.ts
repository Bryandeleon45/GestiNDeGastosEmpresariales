import { useState } from "react"
import {
  SOL_PROV,
  type SolProv,
  type SupplierNav,
} from "@/models/portalProveedor"

export function useSupplierPortalController() {
  const [activeNav, setActiveNav] = useState<SupplierNav>("oportunidades")
  const [dark, setDark] = useState(false)
  const [solFilter, setSolFilter] =
    useState<"todas" | "pendientes" | "enviadas">("todas")
  const [proformaTarget, setProformaTarget] = useState<SolProv | null>(null)
  const [showSubir, setShowSubir] = useState(false)
  const [isDraggingFEL, setIsDraggingFEL] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "", sub: "" })
  const [showLogout, setShowLogout] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const fireToast = (message: string, sub: string) => {
    setToast({ show: true, message, sub })
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4500)
  }
  const hideToast = () => setToast((t) => ({ ...t, show: false }))

  const filteredSols =
    solFilter === "pendientes"
      ? SOL_PROV.filter((s) => s.estado === "En Licitación")
      : solFilter === "enviadas"
        ? SOL_PROV.filter(
            (s) =>
              s.estado === "Cotización Enviada" || s.estado === "Adjudicado",
          )
        : SOL_PROV

  return {
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
  }
}
