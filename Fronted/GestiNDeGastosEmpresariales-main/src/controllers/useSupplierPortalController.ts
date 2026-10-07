import { useState, useEffect, useCallback } from "react"
import {
  obtenerPerfilPortal,
  obtenerResumenPortal,
  listarOportunidades,
  obtenerOportunidad,
  guardarBorradorCotizacion,
  enviarCotizacion,
  retirarCotizacion,
  declinarOportunidad,
  listarNotificaciones,
  marcarNotificacionLeida,
  listarOrdenes,
  listarEntregas,
  type PortalPerfil,
  type PortalResumen,
  type Oportunidad,
  type OportunidadDetalle,
  type OrdenPortal,
  type EntregaPortal,
} from "@/api/portal"

export type TabPortal = "abiertas" | "cotizadas" | "adjudicadas" | "historial"

export function useSupplierPortalController() {
  // UI
  const [activeNav, setActiveNav] = useState<"oportunidades" | "ordenes" | "entregas" | "configuracion">("oportunidades")
  const [dark, setDark] = useState(false)
  const [tab, setTab] = useState<TabPortal>("abiertas")
  const [q, setQ] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [showSubir, setShowSubir] = useState(false)
  const [isDraggingFEL, setIsDraggingFEL] = useState(false)

  // Toast
  const [toast, setToast] = useState({ show: false, message: "", sub: "" })
  const fireToast = useCallback((message: string, sub: string) => {
    setToast({ show: true, message, sub })
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4500)
  }, [])
  const hideToast = useCallback(() => setToast((t) => ({ ...t, show: false })), [])

  // Datos
  const [perfil, setPerfil] = useState<PortalPerfil | null>(null)
  const [resumen, setResumen] = useState<PortalResumen | null>(null)
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([])
  const [ordenes, setOrdenes] = useState<OrdenPortal[]>([])
  const [entregas, setEntregas] = useState<EntregaPortal[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [loading, setLoading] = useState(false)

  // Cotización
  const [cotizarTarget, setCotizarTarget] = useState<OportunidadDetalle | null>(null)

  const cargarResumen = useCallback(async () => {
    try {
      const r = await obtenerResumenPortal()
      setResumen(r)
    } catch {
      /* silencioso */
    }
  }, [])

  const cargarOportunidades = useCallback(async (t = tab, query = q) => {
    try {
      const rows = await listarOportunidades(t, query)
      setOportunidades(rows)
    } catch {
      setOportunidades([])
    }
  }, [tab, q])

  const cargarOrdenes = useCallback(async () => {
    try {
      setOrdenes(await listarOrdenes())
    } catch {
      setOrdenes([])
    }
  }, [])

  const cargarEntregas = useCallback(async () => {
    try {
      setEntregas(await listarEntregas())
    } catch {
      setEntregas([])
    }
  }, [])

  const cargarNotificaciones = useCallback(async () => {
    try {
      const n = await listarNotificaciones()
      setNoLeidas(n.no_leidas)
    } catch {
      setNoLeidas(0)
    }
  }, [])

  const recargar = useCallback(async () => {
    setLoading(true)
    await Promise.allSettled([
      obtenerPerfilPortal().then(setPerfil),
      cargarResumen(),
      cargarOportunidades(tab, q),
      cargarOrdenes(),
      cargarEntregas(),
      cargarNotificaciones(),
    ])
    setLoading(false)
  }, [cargarResumen, cargarOportunidades, cargarOrdenes, cargarEntregas, cargarNotificaciones, tab, q])

  useEffect(() => {
    recargar()
  }, [recargar])

  const abrirOportunidad = useCallback(async (idProceso: number) => {
    try {
      const det = await obtenerOportunidad(idProceso)
      setCotizarTarget(det)
      return det
    } catch (e) {
      fireToast("Error", (e as Error).message || "No se pudo cargar la oportunidad")
      return null
    }
  }, [fireToast])

  const cerrarCotizar = useCallback(() => setCotizarTarget(null), [])

  const guardarBorrador = useCallback(
    async (idProceso: number, data: Parameters<typeof guardarBorradorCotizacion>[1]) => {
      return guardarBorradorCotizacion(idProceso, data)
    },
    [],
  )

  const enviar = useCallback(async (idProceso: number) => {
    return enviarCotizacion(idProceso)
  }, [])

  const retirar = useCallback(async (idProceso: number) => {
    return retirarCotizacion(idProceso)
  }, [])

  const declinar = useCallback(async (idProceso: number, motivo?: string) => {
    return declinarOportunidad(idProceso, motivo)
  }, [])

  const marcarLeida = useCallback(async (id: number) => {
    try {
      await marcarNotificacionLeida(id)
      setNoLeidas((n) => Math.max(0, n - 1))
    } catch {
      /* silencioso */
    }
  }, [])

  return {
    activeNav,
    setActiveNav,
    dark,
    setDark,
    tab,
    setTab,
    q,
    setQ,
    toast,
    fireToast,
    hideToast,
    showLogout,
    setShowLogout,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    showSubir,
    setShowSubir,
    isDraggingFEL,
    setIsDraggingFEL,
    perfil,
    resumen,
    oportunidades,
    ordenes,
    entregas,
    noLeidas,
    loading,
    recargar,
    cargarOportunidades,
    abrirOportunidad,
    cotizarTarget,
    cerrarCotizar,
    guardarBorrador,
    enviar,
    retirar,
    declinar,
    marcarLeida,
  }
}
