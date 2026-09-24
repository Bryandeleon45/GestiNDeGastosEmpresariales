import { useState, useEffect, useRef } from "react"
import {
  ALL_DEPS_SOLICITUDES,
  SOL_PAGE_SIZE,
  type SolicitudRow,
} from "@/models/solicitudes"

export function useDependenciasController() {
  const [depFilter, setDepFilter] = useState("Todas las Dependencias")
  const [depOpen, setDepOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [detailRow, setDetailRow] = useState<SolicitudRow | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const depRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (depRef.current && !depRef.current.contains(e.target as Node))
        setDepOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const filtered =
    depFilter === "Todas las Dependencias"
      ? ALL_DEPS_SOLICITUDES
      : ALL_DEPS_SOLICITUDES.filter((r) => r.dep === depFilter)

  const totalPages = Math.max(1, Math.ceil(filtered.length / SOL_PAGE_SIZE))
  const pageRows = filtered.slice(
    (page - 1) * SOL_PAGE_SIZE,
    page * SOL_PAGE_SIZE,
  )

  const grouped: Array<{ type: "header" dep: string idx: number } | {
    type: "row"
    row: SolicitudRow
    idx: number
  }> = []
  let lastDep = ""
  let gIdx = 0
  pageRows.forEach((r) => {
    if (r.dep !== lastDep) {
      grouped.push({ type: "header", dep: r.dep, idx: gIdx++ })
      lastDep = r.dep
    }
    grouped.push({ type: "row", row: r, idx: gIdx++ })
  })

  return {
    depFilter,
    setDepFilter,
    depOpen,
    setDepOpen,
    page,
    setPage,
    detailRow,
    setDetailRow,
    hoveredRow,
    setHoveredRow,
    depRef,
    filtered,
    totalPages,
    pageRows,
    grouped,
  }
}
