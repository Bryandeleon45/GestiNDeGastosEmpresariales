import { useState, useEffect, useRef, useCallback } from "react"
import {
  listarFacturas,
  obtenerResumenFacturacion,
  obtenerCronograma,
  type Factura,
  type ResumenFacturacion,
  type CronogramaItem,
} from "@/api/facturacion"

export type FacturaEstadoFilter = "Todos" | "Pagado" | "Pendiente" | "Vencido" | "Rechazada"

export function useFacturacionController(onToast: (m: string, s: string) => void) {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [resumen, setResumen] = useState<ResumenFacturacion | null>(null)
  const [cronograma, setCronograma] = useState<CronogramaItem[]>([])
  const [estadoFilter, setEstadoFilter] = useState<FacturaEstadoFilter>("Todos")
  const [showEstadoDD, setShowEstadoDD] = useState(false)
  const [showNuevaOrden, setShowNuevaOrden] = useState(false)
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null)
  const estadoDDRef = useRef<HTMLDivElement>(null)

  const loadFacturas = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listarFacturas({ estado: estadoFilter === "Todos" ? undefined : estadoFilter })
      setFacturas(data)
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudieron cargar las facturas")
      setFacturas([])
    } finally {
      setLoading(false)
    }
  }, [estadoFilter, onToast])

  const loadResumen = useCallback(async () => {
    try {
      setResumen(await obtenerResumenFacturacion())
    } catch {
      // no fatal
    }
  }, [])

  const loadCronograma = useCallback(async () => {
    try {
      setCronograma(await obtenerCronograma())
    } catch {
      // no fatal
    }
  }, [])

  useEffect(() => {
    loadFacturas()
  }, [loadFacturas])

  useEffect(() => {
    loadResumen()
    loadCronograma()
  }, [loadResumen, loadCronograma])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (estadoDDRef.current && !estadoDDRef.current.contains(e.target as Node)) setShowEstadoDD(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const reload = useCallback(() => {
    loadFacturas()
    loadResumen()
    loadCronograma()
  }, [loadFacturas, loadResumen, loadCronograma])

  return {
    facturas,
    loading,
    resumen,
    cronograma,
    estadoFilter,
    setEstadoFilter,
    showEstadoDD,
    setShowEstadoDD,
    showNuevaOrden,
    setShowNuevaOrden,
    selectedFactura,
    setSelectedFactura,
    estadoDDRef,
    reload,
  }
}
