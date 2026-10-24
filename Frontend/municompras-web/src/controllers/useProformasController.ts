import { useState, useCallback, useEffect } from "react"
import { listarOrdenesCompra, type OrdenCompraLista } from "@/api/proformas"

export type ProformasTab = "recibidas" | "ordenes"

export function useProformasController(onToast: (m: string, s: string) => void) {
  const [tab, setTab] = useState<ProformasTab>("recibidas")
  const [ordenes, setOrdenes] = useState<OrdenCompraLista[]>([])
  const [loadingOrdenes, setLoadingOrdenes] = useState(true)

  const loadOrdenes = useCallback(async () => {
    setLoadingOrdenes(true)
    try {
      const data = await listarOrdenesCompra()
      setOrdenes(data)
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudieron cargar las órdenes")
      setOrdenes([])
    } finally {
      setLoadingOrdenes(false)
    }
  }, [onToast])

  useEffect(() => {
    if (tab === "ordenes") loadOrdenes()
  }, [tab, loadOrdenes])

  const reload = useCallback(() => {
    if (tab === "ordenes") loadOrdenes()
  }, [loadOrdenes, tab])

  return {
    tab,
    setTab,
    ordenes,
    loadingOrdenes,
    reload,
    loadOrdenes,
  }
}
