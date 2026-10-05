import { useState, useCallback, useEffect } from "react"
import {
  listarProcesos,
  listarOrdenesCompra,
  type Proceso,
  type OrdenCompra,
} from "@/api/proformas"

export type ProformasTab = "procesos" | "ordenes"

export function useProformasController(onToast: (m: string, s: string) => void) {
  const [tab, setTab] = useState<ProformasTab>("procesos")
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [loadingProcesos, setLoadingProcesos] = useState(true)
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
  const [loadingOrdenes, setLoadingOrdenes] = useState(true)

  const loadProcesos = useCallback(async () => {
    setLoadingProcesos(true)
    try {
      const data = await listarProcesos()
      setProcesos(data)
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudieron cargar los procesos")
      setProcesos([])
    } finally {
      setLoadingProcesos(false)
    }
  }, [onToast])

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
    loadProcesos()
  }, [loadProcesos])

  useEffect(() => {
    if (tab === "ordenes") loadOrdenes()
  }, [tab, loadOrdenes])

  const reload = useCallback(() => {
    loadProcesos()
    if (tab === "ordenes") loadOrdenes()
  }, [loadProcesos, loadOrdenes, tab])

  return {
    tab,
    setTab,
    procesos,
    loadingProcesos,
    ordenes,
    loadingOrdenes,
    reload,
    loadOrdenes,
  }
}
