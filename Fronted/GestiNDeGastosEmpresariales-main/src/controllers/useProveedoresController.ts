import { useState, useEffect, useCallback } from "react"
import {
  listarProveedores,
  obtenerResumenProveedores,
  listarTiposProveedor,
  listarRolesPortal,
  cambiarRolPortal,
  resetClavePortal,
  bloquearPortal,
  cambiarEstadoProveedor,
  type Proveedor,
  type ProveedorResumen,
  type TipoProveedor,
  type RolPortal,
} from "@/api/proveedores"
import {
  initialsOf,
  avatarColorOf,
  CONEXION_STYLE,
  PROV_PAGE_SIZE,
  type ProveedorRow,
} from "@/models/proveedores"

function toRow(p: Proveedor): ProveedorRow {
  const cs = CONEXION_STYLE[p.estado_conexion]
  return {
    id: p.id_proveedor,
    initials: initialsOf(p.razon_social),
    avatarColor: avatarColorOf(p.id_proveedor),
    name: p.razon_social,
    nit: p.nit,
    rol: p.rol ?? "Sin acceso",
    rolId: p.id_rol,
    estado: p.estado_conexion,
    estadoLabel: cs.label,
    ultimaActividad: p.fecha_ultimo_acceso
      ? new Date(p.fecha_ultimo_acceso).toLocaleString("es-GT")
      : "Nunca",
    email: p.correo,
    telefono: p.telefono ?? "",
    categoria: p.tipo,
    activo: p.activo,
    tieneAcceso: p.tiene_acceso,
    nombreUsuario: p.nombre_usuario,
  }
}

export function useProveedoresController(onToast: (m: string, s: string) => void) {
  const [tab, setTab] = useState<"Todos" | "Activos" | "Inactivos">("Todos")
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const [rows, setRows] = useState<ProveedorRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showConectar, setShowConectar] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  const [resumen, setResumen] = useState<ProveedorResumen>({
    total: 0,
    activos_portal: 0,
    sin_conexion: 0,
    bloqueados: 0,
  })
  const [tipos, setTipos] = useState<TipoProveedor[]>([])
  const [rolesPortal, setRolesPortal] = useState<RolPortal[]>([])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const estado = tab === "Activos" ? "activos" : tab === "Inactivos" ? "inactivos" : undefined
      const res = await listarProveedores({ page, pageSize: PROV_PAGE_SIZE, q: q || undefined, estado })
      setRows(res.data.map(toRow))
      setTotal(res.total)
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudieron cargar los proveedores")
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, tab, q, onToast])

  const loadResumen = useCallback(async () => {
    try {
      const r = await obtenerResumenProveedores()
      setResumen(r)
    } catch {
      // no fatal
    }
  }, [])

  const loadCatalogos = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([listarTiposProveedor(), listarRolesPortal()])
      setTipos(t)
      setRolesPortal(r)
    } catch {
      // no fatal
    }
  }, [])

  useEffect(() => {
    loadResumen()
    loadCatalogos()
  }, [loadResumen, loadCatalogos])

  useEffect(() => {
    loadList()
  }, [loadList])

  const reload = useCallback(() => {
    loadList()
    loadResumen()
  }, [loadList, loadResumen])

  const totalPages = Math.max(1, Math.ceil(total / PROV_PAGE_SIZE))
  const pageRows = rows

  const cambiarRol = async (row: ProveedorRow, idRol: number, label: string) => {
    try {
      await cambiarRolPortal(row.id, idRol)
      onToast("Rol actualizado", `${row.name} → ${label}`)
      reload()
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cambiar el rol")
    }
  }

  const resetClave = async (row: ProveedorRow) => {
    try {
      const r = await resetClavePortal(row.id)
      onToast(
        "Credenciales restablecidas",
        `${row.nombreUsuario ?? row.name} — clave temporal: ${r.clave_temporal}`,
      )
      reload()
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo restablecer la clave")
    }
  }

  const toggleBloqueo = async (row: ProveedorRow) => {
    const bloquear = row.estado !== "bloqueado"
    try {
      await bloquearPortal(row.id, bloquear)
      onToast(
        bloquear ? "Acceso bloqueado" : "Acceso restaurado",
        `${row.name} ${bloquear ? "fue bloqueado" : "fue desbloqueado"}.`,
      )
      reload()
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cambiar el bloqueo")
    }
  }

  const toggleEstado = async (row: ProveedorRow) => {
    try {
      await cambiarEstadoProveedor(row.id, !row.activo)
      onToast(
        row.activo ? "Proveedor desactivado" : "Proveedor activado",
        row.name,
      )
      reload()
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cambiar el estado")
    }
  }

  return {
    tab,
    setTab,
    page,
    setPage,
    q,
    setQ,
    rows,
    total,
    loading,
    totalPages,
    pageRows,
    showConectar,
    setShowConectar,
    hoveredRow,
    setHoveredRow,
    resumen,
    tipos,
    rolesPortal,
    reload,
    cambiarRol,
    resetClave,
    toggleBloqueo,
    toggleEstado,
  }
}
