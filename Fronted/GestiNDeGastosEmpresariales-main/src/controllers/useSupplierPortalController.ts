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
  listarOrdenes,
  listarEntregas,
  listarPedidosAsignados,
  listarFacturas,
  listarOrdenesFacturables,
  obtenerInformePortal,
  exportarInformePortal,
  type PortalPerfil,
  type PortalResumen,
  type Oportunidad,
  type OportunidadDetalle,
  type OrdenPortal,
  type EntregaPortal,
  type PedidoAsignado,
  type FacturaPortal,
  type OrdenFacturable,
  type InformeFila,
  type InformeTotales,
  type InformeFiltros,
} from "@/api/portal"

export type TabPortal = "abiertas" | "cotizadas" | "adjudicadas" | "historial"

export function useSupplierPortalController() {
  // UI
  const [activeNav, setActiveNav] = useState<"oportunidades" | "pedidos" | "ordenes" | "entregas" | "configuracion">("oportunidades")
  const [dark, setDark] = useState(false)
  const [tab, setTab] = useState<TabPortal>("abiertas")
  const [q, setQ] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [showSubir, setShowSubir] = useState(false)

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
  const [pedidosAsignados, setPedidosAsignados] = useState<PedidoAsignado[]>([])
  const [facturas, setFacturas] = useState<FacturaPortal[]>([])
  const [ordenesFacturables, setOrdenesFacturables] = useState<OrdenFacturable[]>([])
  const [facturaTargetOC, setFacturaTargetOC] = useState<number | null>(null)
  const [informe, setInforme] = useState<InformeFila[]>([])
  const [informeTotales, setInformeTotales] = useState<InformeTotales | null>(null)
  const [informeFiltros, setInformeFiltros] = useState<InformeFiltros>({})
  const [loading, setLoading] = useState(false)
  const [showCargarFactura, setShowCargarFactura] = useState(false)

  // Cotización
  const [cotizarTarget, setCotizarTarget] = useState<OportunidadDetalle | null>(null)

  // Detalle de oportunidad (solo lectura)
  const [detalleTarget, setDetalleTarget] = useState<OportunidadDetalle | null>(null)

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

  const cargarPedidosAsignados = useCallback(async () => {
    try {
      setPedidosAsignados(await listarPedidosAsignados())
    } catch {
      setPedidosAsignados([])
    }
  }, [])

  const cargarFacturas = useCallback(async () => {
    try {
      setFacturas(await listarFacturas())
    } catch {
      setFacturas([])
    }
  }, [])

  const cargarOrdenesFacturables = useCallback(async () => {
    try {
      setOrdenesFacturables(await listarOrdenesFacturables())
    } catch {
      setOrdenesFacturables([])
    }
  }, [])

  const cargarInforme = useCallback(async (f = informeFiltros) => {
    try {
      const r = await obtenerInformePortal(f)
      setInforme(r.filas)
      setInformeTotales(r.totales)
    } catch {
      setInforme([])
      setInformeTotales(null)
    }
  }, [informeFiltros])

  const exportarInforme = useCallback(
    async (formato: "csv" | "pdf") => {
      try {
        const blob = await exportarInformePortal(formato, informeFiltros)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `informe_solicitudes.${formato === "pdf" ? "pdf" : "csv"}`
        a.click()
        window.URL.revokeObjectURL(url)
        fireToast("Exportado", `El archivo ${formato.toUpperCase()} se descargó correctamente.`)
      } catch (e) {
        fireToast("Error", e instanceof Error ? e.message : "No se pudo exportar")
      }
    },
    [informeFiltros, fireToast],
  )

  const recargar = useCallback(async () => {
    setLoading(true)
    await Promise.allSettled([
      obtenerPerfilPortal().then(setPerfil),
      cargarResumen(),
      cargarOportunidades(tab, q),
      cargarOrdenes(),
      cargarEntregas(),
      cargarPedidosAsignados(),
      cargarFacturas(),
      cargarOrdenesFacturables(),
      cargarInforme(informeFiltros),
    ])
    setLoading(false)
  }, [cargarResumen, cargarOportunidades, cargarOrdenes, cargarEntregas, cargarPedidosAsignados, cargarFacturas, cargarOrdenesFacturables, cargarInforme, informeFiltros, tab, q])

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

  const verOportunidad = useCallback(async (idProceso: number) => {
    try {
      const det = await obtenerOportunidad(idProceso)
      setDetalleTarget(det)
    } catch (e) {
      fireToast("Error", (e as Error).message || "No se pudo cargar la oportunidad")
    }
  }, [fireToast])

  const cerrarDetalle = useCallback(() => setDetalleTarget(null), [])

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
    showCargarFactura,
    setShowCargarFactura,
    perfil,
    resumen,
    oportunidades,
    ordenes,
    entregas,
    pedidosAsignados,
    facturas,
    ordenesFacturables,
    facturaTargetOC,
    setFacturaTargetOC,
    cargarOrdenesFacturables,
    informe,
    informeTotales,
    informeFiltros,
    setInformeFiltros,
    cargarInforme,
    exportarInforme,
    loading,
    recargar,
    cargarOportunidades,
    cargarFacturas,
    cargarOrdenes,
    abrirOportunidad,
    cotizarTarget,
    cerrarCotizar,
    verOportunidad,
    detalleTarget,
    cerrarDetalle,
    guardarBorrador,
    enviar,
    retirar,
    declinar,
  }
}
