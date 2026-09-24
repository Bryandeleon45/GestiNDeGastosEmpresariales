import { useState, useEffect } from "react"
import { G } from "@/constants/theme"

export type AppScreen = "login" | "admin" | "supplier"

export function useAppController() {
  const [screen, setScreen] = useState<AppScreen>("login")
  const [activeNav, setActiveNav] = useState("dashboard")
  const [darkAdmin, setDarkAdmin] = useState(false)
  const [accentColor, setAccentColor] = useState(G)
  const [compactUI, setCompactUI] = useState(false)
  const [animEnabled, setAnimEnabled] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [showSolModal, setShowSolModal] = useState(false)
  const [showGasModal, setShowGasModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showTicketDrawer, setShowTicketDrawer] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "", sub: "" })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-theme", darkAdmin ? "dark" : "light")
    root.setAttribute("data-compact", compactUI ? "true" : "false")
    root.style.setProperty("--muni-accent", accentColor)
    const r = parseInt(accentColor.slice(1, 3), 16),
      gv = parseInt(accentColor.slice(3, 5), 16),
      b = parseInt(accentColor.slice(5, 7), 16)
    root.style.setProperty("--muni-accent-light", `rgba(${r},${gv},${b},0.1)`)
    root.style.setProperty("--muni-accent-border", `rgba(${r},${gv},${b},0.3)`)
    if (!animEnabled) root.style.setProperty("--muni-transition", "none")
    else root.style.removeProperty("--muni-transition")
  }, [darkAdmin, accentColor, compactUI, animEnabled])

  const fireToast = (message: string, sub: string) =>
    setToast({ show: true, message, sub })
  const hideToast = () => setToast({ show: false, message: "", sub: "" })

  const DK = darkAdmin
  const thBg = DK ? "#0F172A" : "#F8F9FA"
  const thSurface = DK ? "#1E293B" : "#FFFFFF"
  const thBorder = DK ? "#334155" : "#F1F5F9"
  const thText = DK ? "#F8FAFC" : "#111827"
  const thSub = DK ? "#94A3B8" : "#6B7280"
  const thNav = DK ? "#0B1120" : "#FFFFFF"
  const ac = accentColor

  const goToDash = () => {
    setActiveNav("dashboard")
    setMobileSidebar(false)
  }

  return {
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
  }
}
