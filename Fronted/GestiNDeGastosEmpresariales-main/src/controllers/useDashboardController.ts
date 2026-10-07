import { useState, useEffect, useCallback } from "react"
import {
  obtenerResumenDashboard,
  obtenerComprasPorDependencia,
  obtenerSolicitudesPorEstado,
  obtenerAlertas,
  obtenerActividadReciente,
  type DashboardKpis,
  type GraficoDato,
  type DashboardAlertas,
  type ActividadReciente,
} from "@/api/dashboard"

export function useDashboardController() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [comprasDep, setComprasDep] = useState<GraficoDato[]>([])
  const [solicitudesEstado, setSolicitudesEstado] = useState<GraficoDato[]>([])
  const [alertas, setAlertas] = useState<DashboardAlertas | null>(null)
  const [actividad, setActividad] = useState<ActividadReciente[]>([])

  const cargar = useCallback(async () => {
    const [res, comp, sol, al, act] = await Promise.allSettled([
      obtenerResumenDashboard(),
      obtenerComprasPorDependencia(),
      obtenerSolicitudesPorEstado(),
      obtenerAlertas(),
      obtenerActividadReciente(),
    ])
    if (res.status === "fulfilled") setKpis(res.value.kpis)
    if (comp.status === "fulfilled") setComprasDep(comp.value)
    if (sol.status === "fulfilled") setSolicitudesEstado(sol.value)
    if (al.status === "fulfilled") setAlertas(al.value)
    if (act.status === "fulfilled") setActividad(act.value)
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    kpis,
    comprasDep,
    solicitudesEstado,
    alertas,
    actividad,
    cargar,
  }
}
