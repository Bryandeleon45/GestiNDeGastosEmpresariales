import { useState, useEffect, useRef } from "react"
import {
  ALL_FACTURAS,
  type FactEstado,
  type Factura,
} from "@/models/facturacion"

export function useFacturacionController() {
  const [showNuevaOrden, setShowNuevaOrden] = useState(false)
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null)
  const [estadoFilter, setEstadoFilter] = useState<"Todos" | FactEstado>(
    "Todos",
  )
  const [showEstadoDD, setShowEstadoDD] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [calMonth, setCalMonth] = useState(0)
  const estadoDDRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        estadoDDRef.current &&
        !estadoDDRef.current.contains(e.target as Node)
      )
        setShowEstadoDD(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const filtered =
    estadoFilter === "Todos"
      ? ALL_FACTURAS
      : ALL_FACTURAS.filter((f) => f.estado === estadoFilter)

  return {
    showNuevaOrden,
    setShowNuevaOrden,
    selectedFactura,
    setSelectedFactura,
    estadoFilter,
    setEstadoFilter,
    showEstadoDD,
    setShowEstadoDD,
    isDragging,
    setIsDragging,
    calMonth,
    setCalMonth,
    estadoDDRef,
    filtered,
  }
}
