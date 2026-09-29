import { useEffect, useState, useCallback } from "react"
import { type UsuarioRecord, type UsuarioFormData } from "@/models/usuarios"
import {
  listarUsuarios,
  crearUsuario,
  editarUsuario,
  cambiarEstadoUsuario,
  type UsuarioApi,
} from "@/api/usuarios"

function mapApiToRecord(u: UsuarioApi): UsuarioRecord {
  return {
    id: String(u.id_empleado),
    codigo: u.codigo,
    nombre: u.nombre,
    dpi: u.dpi,
    estado: u.estado,
    telefono: u.telefono ?? "",
    ingreso: u.ingreso ? new Date(u.ingreso).toLocaleDateString("es-GT") : "",
    tieneAcceso: u.tieneAcceso,
    primer_nombre: u.primer_nombre,
    apellido: u.apellido,
    id_empleado: u.id_empleado,
    id_usuario: u.id_usuario,
    nombre_usuario: u.nombre_usuario,
    correo: u.correo,
    id_rol: u.id_rol,
    rol: u.rol,
    id_dependencia: u.id_dependencia,
    dependencia: u.dependencia,
    id_puesto: u.id_puesto,
    puesto: u.puesto,
  }
}

export function useUsuariosController(onToast: (m: string, s: string) => void) {
  const [usuarios, setUsuarios] = useState<UsuarioRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterEst, setFilterEst] = useState("todos")
  const [page, setPage] = useState(1)
  const [modalUser, setModalUser] = useState<UsuarioRecord | null | undefined>(
    undefined,
  )
  const PAGE_SIZE = 6

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await listarUsuarios({ pageSize: 100 })
      setUsuarios(data.map(mapApiToRecord))
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cargar")
    } finally {
      setLoading(false)
    }
  }, [onToast])

  useEffect(() => {
    load()
  }, [load])

  const filtered = usuarios.filter((u) => {
    const q = search.toLowerCase()
    const matchQ =
      !q ||
      u.nombre.toLowerCase().includes(q) ||
      u.codigo.toLowerCase().includes(q) ||
      u.dpi.includes(q)
    const matchE = filterEst === "todos" || u.estado === filterEst
    return matchQ && matchE
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const clearFilters = () => {
    setSearch("")
    setFilterEst("todos")
    setPage(1)
  }

  const handleSave = async (form: UsuarioFormData) => {
    const nombreCompleto = `${form.nombre} ${form.apellido}`.trim()
    if (modalUser?.id_empleado) {
      await editarUsuario(modalUser.id_empleado, form)
    } else {
      await crearUsuario(form)
    }
    await load()
    onToast(
      modalUser ? "Usuario actualizado" : "Usuario registrado",
      nombreCompleto,
    )
    setPage(1)
  }

  const toggleEstado = async (id: string) => {
    const u = usuarios.find((x) => x.id === id)
    if (!u) return
    const activar = u.estado === "Inactivo"
    try {
      await cambiarEstadoUsuario(id, activar ? "activar" : "desactivar")
      await load()
      onToast(
        `Usuario ${activar ? "activado" : "desactivado"}`,
        u.nombre,
      )
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo actualizar")
    }
  }

  const totActivos = usuarios.filter((u) => u.estado === "Activo").length
  const totInactivos = usuarios.filter((u) => u.estado === "Inactivo").length
  const totAcceso = usuarios.filter((u) => u.tieneAcceso).length

  return {
    usuarios,
    setUsuarios,
    loading,
    search,
    setSearch,
    filterEst,
    setFilterEst,
    page,
    setPage,
    modalUser,
    setModalUser,
    PAGE_SIZE,
    filtered,
    totalPages,
    paginated,
    clearFilters,
    handleSave,
    toggleEstado,
    totActivos,
    totInactivos,
    totAcceso,
  }
}
