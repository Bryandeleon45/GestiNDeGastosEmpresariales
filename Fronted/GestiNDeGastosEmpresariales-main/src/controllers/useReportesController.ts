import { useState, useEffect, useCallback } from "react"
import {
  listarReportes,
  obtenerOpcionesFiltros,
  obtenerReporte,
  exportarReporte,
  type ReporteCatalogo,
  type ReporteData,
  type OpcionesFiltros,
  type FiltrosReporte,
} from "@/api/reportes"

export function useReportesController(onToast: (m: string, s: string) => void) {
  const [catalogo, setCatalogo] = useState<ReporteCatalogo[]>([])
  const [opciones, setOpciones] = useState<OpcionesFiltros | null>(null)
  const [resumen, setResumen] = useState<ReporteData | null>(null)
  const [codigo, setCodigo] = useState<string | null>(null)
  const [data, setData] = useState<ReporteData | null>(null)
  const [filtros, setFiltros] = useState<FiltrosReporte>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listarReportes().then(setCatalogo).catch(() => {})
    obtenerOpcionesFiltros().then(setOpciones).catch(() => {})
    obtenerReporte("RPT-11").then(setResumen).catch(() => {})
  }, [])

  const cargar = useCallback(
    async (cod: string, f: FiltrosReporte) => {
      setLoading(true)
      try {
        setData(await obtenerReporte(cod, f))
      } catch (e) {
        onToast("Error", e instanceof Error ? e.message : "No se pudo cargar el reporte")
      } finally {
        setLoading(false)
      }
    },
    [onToast],
  )

  const seleccionar = (cod: string | null) => {
    setCodigo(cod)
    setFiltros({})
    if (cod) {
      cargar(cod, {})
    } else {
      setData(null)
    }
  }

  const aplicarFiltros = (f: FiltrosReporte) => {
    setFiltros(f)
    if (codigo) cargar(codigo, f)
  }

  const exportar = async () => {
    if (!codigo) return
    try {
      const blob = await exportarReporte(codigo, filtros)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reporte_${codigo}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      onToast("Exportado", "El archivo CSV se descargó correctamente.")
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo exportar")
    }
  }

  return {
    catalogo,
    opciones,
    resumen,
    codigo,
    data,
    filtros,
    loading,
    seleccionar,
    aplicarFiltros,
    exportar,
  }
}
