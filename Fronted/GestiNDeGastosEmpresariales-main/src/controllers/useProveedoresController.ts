import { useState } from "react"
import {
  ALL_PROVEEDORES,
  PROV_PAGE_SIZE,
  type ProvRol,
} from "@/models/proveedores"

export function useProveedoresController() {
  const [tab, setTab] = useState<"Todos" | "Activos" | "Inactivos">("Todos")
  const [page, setPage] = useState(1)
  const [showConectar, setShowConectar] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [roles, setRoles] = useState<Record<string, ProvRol>>(() =>
    Object.fromEntries(ALL_PROVEEDORES.map((p) => [p.id, p.rol])),
  )

  const filtered = ALL_PROVEEDORES.filter((p) => {
    if (tab === "Activos") return p.estado === "Conectado"
    if (tab === "Inactivos") return p.estado !== "Conectado"
    return true
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PROV_PAGE_SIZE))
  const pageRows = filtered.slice(
    (page - 1) * PROV_PAGE_SIZE,
    page * PROV_PAGE_SIZE,
  )

  const activos = ALL_PROVEEDORES.filter((p) => p.estado === "Conectado").length

  return {
    tab,
    setTab,
    page,
    setPage,
    showConectar,
    setShowConectar,
    hoveredRow,
    setHoveredRow,
    roles,
    setRoles,
    filtered,
    totalPages,
    pageRows,
    activos,
  }
}
