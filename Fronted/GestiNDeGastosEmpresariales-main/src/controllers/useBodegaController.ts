import { useState, useEffect, useCallback } from "react"
import {
  listarInventario,
  listarAlertasStock,
  listarRecepciones,
  listarKardex,
  obtenerResumenBodega,
  type InsumoInventario,
  type AlertaStock,
  type Recepcion,
  type KardexMovimiento,
  type ResumenBodega,
} from "@/api/bodega"

export type BodegaTab = "recepciones" | "inventario" | "kardex"

export function useBodegaController(onToast: (m: string, s: string) => void) {
  const [tab, setTab] = useState<BodegaTab>("recepciones")
  const [inventario, setInventario] = useState<InsumoInventario[]>([])
  const [alertas, setAlertas] = useState<AlertaStock[]>([])
  const [recepciones, setRecepciones] = useState<Recepcion[]>([])
  const [kardex, setKardex] = useState<KardexMovimiento[]>([])
  const [resumen, setResumen] = useState<ResumenBodega | null>(null)
  const [loadingInventario, setLoadingInventario] = useState(true)
  const [loadingRecepciones, setLoadingRecepciones] = useState(true)

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

  useEffect(() => {
    loadInventario()
    loadRecepciones()
    loadResumen()
  }, [loadInventario, loadRecepciones, loadResumen])

  useEffect(() => {
    if (tab === "kardex") loadKardex()
  }, [tab, loadKardex])

  const reload = useCallback(() => {
    loadInventario()
    loadRecepciones()
    loadResumen()
    if (tab === "kardex") loadKardex()
  }, [loadInventario, loadRecepciones, loadResumen, loadKardex, tab])

  return {
    tab,
    setTab,
    inventario,
    alertas,
    recepciones,
    kardex,
    resumen,
    loadingInventario,
    loadingRecepciones,
    reload,
  }
}
