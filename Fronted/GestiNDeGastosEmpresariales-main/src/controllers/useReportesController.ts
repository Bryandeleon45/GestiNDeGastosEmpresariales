import { useState, useEffect, useRef } from "react"
import {
  CHART_DATA_BY_MONTH,
  DEPTO_ROWS,
  type DeptoEstado,
} from "@/models/reportes"

export function useReportesController() {
  const [month, setMonth] = useState("Octubre 2023")
  const [showMonthDD, setShowMonthDD] = useState(false)
  const [showFiltrar, setShowFiltrar] = useState(false)
  const [estadoFilter, setEstadoFilter] = useState<DeptoEstado | "Todos">(
    "Todos",
  )
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const monthDDRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (monthDDRef.current && !monthDDRef.current.contains(e.target as Node))
        setShowMonthDD(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const chartData = CHART_DATA_BY_MONTH[month]
  const filteredRows =
    estadoFilter === "Todos"
      ? DEPTO_ROWS
      : DEPTO_ROWS.filter((r) => r.estado === estadoFilter)

  return {
    month,
    setMonth,
    showMonthDD,
    setShowMonthDD,
    showFiltrar,
    setShowFiltrar,
    estadoFilter,
    setEstadoFilter,
    hoveredBar,
    setHoveredBar,
    monthDDRef,
    chartData,
    filteredRows,
  }
}
