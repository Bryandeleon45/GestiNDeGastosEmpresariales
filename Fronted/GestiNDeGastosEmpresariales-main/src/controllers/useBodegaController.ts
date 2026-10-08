import { useState, useEffect, useCallback } from "react"
import {
  listarInventario,
  listarAlertasStock,
  listarRecepciones,
  listarKardex,
  obtenerResumenBodega,
  listarValesSalida,
  type InsumoInventario,
  type AlertaStock,
  type Recepcion,
  type KardexMovimiento,
  type ResumenBodega,
  type ValeSalida,
} from "@/api/bodega"
import {
  listarRequisiciones,
  type Requisicion,
} from "@/api/requisiciones"

export type BodegaTab = "solicitudes" | "recepciones" | "inventario" | "kardex" | "vales"

export const ESTADOS_SOLICITUD_FILTRO = [
  { value: "", label: "Todas" },
  { value: "En Revisión", label: "En Revisión" },
  { value: "Aprobada", label: "Aprobada" },
  { value: "Rechazada", label: "Rechazada" },
  { value: "Pendiente", label: "Pendiente" },
  { value: "En Compra", label: "En Compra" },
  { value: "Cancelada", label: "Cancelada" },
] as const

export function useBodegaController(onToast: (m: string, s: string) => void) {
  const [tab, setTab] = useState<BodegaTab>("solicitudes")
  const [inventario, setInventario] = useState<InsumoInventario[]>([])
  const [alertas, setAlertas] = useState<AlertaStock[]>([])
  const [recepciones, setRecepciones] = useState<Recepcion[]>([])
  const [kardex, setKardex] = useState<KardexMovimiento[]>([])
  const [resumen, setResumen] = useState<ResumenBodega | null>(null)
  const [vales, setVales] = useState<ValeSalida[]>([])
  const [solicitudes, setSolicitudes] = useState<Requisicion[]>([])
  const [solEstado, setSolEstado] = useState<string>("En Revisión")
  const [loadingInventario, setLoadingInventario] = useState(true)
  const [loadingRecepciones, setLoadingRecepciones] = useState(true)
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true)

  const loadInventario = useCallback(async () => {
    setLoadingInventario(true)
    try {
      setInventario(await listarInventario())
      setAlertas(await listarAlertasStock())
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cargar el inventario")
    } finally {
      setLoadingInventario(false)
    }
  }, [onToast])

  const loadRecepciones = useCallback(async () => {
    setLoadingRecepciones(true)
    try {
      setRecepciones(await listarRecepciones())
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudieron cargar las recepciones")
    } finally {
      setLoadingRecepciones(false)
    }
  }, [onToast])

  const loadKardex = useCallback(async () => {
    try {
      setKardex(await listarKardex())
    } catch {
      // no fatal
    }
  }, [])

  const loadResumen = useCallback(async () => {
    try {
      setResumen(await obtenerResumenBodega())
    } catch {
      // no fatal
    }
  }, [])

  const loadVales = useCallback(async () => {
    try {
      setVales(await listarValesSalida())
    } catch {
      // no fatal
    }
  }, [])

  const loadSolicitudes = useCallback(async (estado: string) => {
    setLoadingSolicitudes(true)
    try {
      const res = await listarRequisiciones({
        estado: estado || undefined,
        page: 1,
        pageSize: 200,
      })
      setSolicitudes(res.data)
    } catch {
      setSolicitudes([])
    } finally {
      setLoadingSolicitudes(false)
    }
  }, [])

  useEffect(() => {
    loadInventario()
    loadRecepciones()
    loadResumen()
    loadVales()
    loadSolicitudes(solEstado)
  }, [loadInventario, loadRecepciones, loadResumen, loadVales, loadSolicitudes, solEstado])

  useEffect(() => {
    if (tab === "kardex") loadKardex()
  }, [tab, loadKardex])

  const reload = useCallback(() => {
    loadInventario()
    loadRecepciones()
    loadResumen()
    loadVales()
    loadSolicitudes(solEstado)
    if (tab === "kardex") loadKardex()
  }, [loadInventario, loadRecepciones, loadResumen, loadVales, loadSolicitudes, loadKardex, tab, solEstado])

  return {
    tab,
    setTab,
    inventario,
    alertas,
    recepciones,
    kardex,
    resumen,
    vales,
    solicitudes,
    solEstado,
    setSolEstado,
    loadingInventario,
    loadingRecepciones,
    loadingSolicitudes,
    reload,
    loadVales,
  }
}
