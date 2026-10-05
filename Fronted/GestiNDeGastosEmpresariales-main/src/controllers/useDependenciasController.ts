import { useState, useEffect, useRef, useCallback } from "react"
import type { SolicitudRow } from "@/models/solicitudes"
import {
  listarRequisiciones,
  obtenerResumenRequisiciones,
  exportarRequisiciones,
  type Requisicion,
} from "@/api/requisiciones"
import {
  listarDependencias,
  obtenerResumenPresupuesto,
  type PresupuestoResumen,
} from "@/api/catalogos"

export interface ResumenKpis {
  total: number
  pendientes: number
  promedioDias: number
  montoMes: string
  porcentajeEjecucion: number
}

export interface DepOption {
  id: number | null
  label: string
}

const TODAS = "Todas las Dependencias"

function mapRequisicionToRow(r: Requisicion): SolicitudRow {
  const itemNombre = r.item_nombre ?? r.items?.[0]?.insumo_nombre ?? r.items?.[0]?.descripcion_libre ?? "Sin ítems"
  const cantidad = r.item_cantidad ?? r.items?.[0]?.cantidad ?? "0"
  const unidad = r.item_unidad ?? r.items?.[0]?.unidad_simbolo ?? "UND"
  return {
    id: r.codigo_requisicion,
    dep: r.nombre_dependencia,
    item: itemNombre,
    cant: `${cantidad} ${unidad}`,
    prioridad: r.prioridad,
    estado: r.estado,
    fecha: new Date(r.fecha_solicitud).toLocaleDateString("es-GT"),
    monto: `Q ${Number(r.monto_estimado).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`,
    solicitante: `${r.usuario_nombre} ${r.usuario_apellido}`.trim(),
    justificacion: r.justificacion,
    codigo_requisicion: r.codigo_requisicion,
    id_requisicion: r.id_requisicion,
  }
}

export function useDependenciasController(onToast: (m: string, s: string) => void) {
  const [depFilterId, setDepFilterId] = useState<number | null>(null)
  const [depOpen, setDepOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<SolicitudRow[]>([])
  const [total, setTotal] = useState(0)
  const [deps, setDeps] = useState<Array<{ id_dependencia: number; nombre_dependencia: string; siglas: string | null }>>([])
  const [presupuesto, setPresupuesto] = useState<PresupuestoResumen | null>(null)
  const [kpis, setKpis] = useState<ResumenKpis>({
    total: 0,
    pendientes: 0,
    promedioDias: 0,
    montoMes: "0",
    porcentajeEjecucion: 0,
  })
  const depRef = useRef<HTMLDivElement>(null)

  const PAGE_SIZE = 5

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (depRef.current && !depRef.current.contains(e.target as Node))
        setDepOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const loadDeps = useCallback(async () => {
    try {
      const data = await listarDependencias()
      setDeps(data.filter((d) => d.activo))
    } catch {
      // no fatal
    }
  }, [])

  const loadPresupuesto = useCallback(async () => {
    try {
      const data = await obtenerResumenPresupuesto()
      setPresupuesto(data)
    } catch {
      // no fatal
    }
  }, [])

  const loadKpis = useCallback(async () => {
    try {
      const data = await obtenerResumenRequisiciones({ dependencia: depFilterId ?? undefined })
      setKpis({
        total: data.total,
        pendientes: data.pendientes,
        promedioDias: Number(data.promedio_dias_pendientes) || 0,
        montoMes: Number(data.monto_mes_actual).toLocaleString("es-GT"),
        porcentajeEjecucion: 0,
      })
    } catch {
      // no fatal
    }
  }, [depFilterId])

  const loadRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listarRequisiciones({ page, pageSize: PAGE_SIZE, dependencia: depFilterId ?? undefined })
      setRows(res.data.map(mapRequisicionToRow))
      setTotal(res.total)
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudieron cargar las solicitudes")
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, depFilterId, onToast])

  useEffect(() => {
    loadDeps()
    loadPresupuesto()
  }, [loadDeps, loadPresupuesto])

  useEffect(() => {
    loadKpis()
  }, [loadKpis])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const reload = useCallback(() => {
    loadRows()
    loadKpis()
    loadPresupuesto()
  }, [loadRows, loadKpis, loadPresupuesto])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageRows = rows

  const grouped: Array<{ type: "header"; dep: string; idx: number } | { type: "row"; row: SolicitudRow; idx: number }> = []
  let lastDep = ""
  let gIdx = 0
  pageRows.forEach((r) => {
    if (r.dep !== lastDep) {
      grouped.push({ type: "header", dep: r.dep, idx: gIdx++ })
      lastDep = r.dep
    }
    grouped.push({ type: "row", row: r, idx: gIdx++ })
  })

  const depFilter = depFilterId == null
    ? TODAS
    : deps.find((d) => d.id_dependencia === depFilterId)?.nombre_dependencia ?? TODAS

  const depOptions: DepOption[] = [
    { id: null, label: TODAS },
    ...deps.map((d) => ({ id: d.id_dependencia, label: d.nombre_dependencia })),
  ]

  const exportar = async () => {
    try {
      const blob = await exportarRequisiciones({ dependencia: depFilterId ?? undefined })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "requisiciones.csv"
      a.click()
      window.URL.revokeObjectURL(url)
      onToast("Exportado", "Archivo CSV descargado")
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo exportar")
    }
  }

  const imprimir = () => {
    window.print()
  }

  return {
    depFilter,
    depFilterId,
    setDepFilterId,
    depOpen,
    setDepOpen,
    page,
    setPage,
    hoveredRow,
    setHoveredRow,
    depRef,
    loading,
    total,
    totalPages,
    pageRows,
    grouped,
    depOptions,
    presupuesto,
    kpis,
    exportar,
    imprimir,
    reload,
  }
}
