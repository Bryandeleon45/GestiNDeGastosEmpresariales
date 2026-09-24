import { useState } from "react"
import { USUARIOS_INIT, type UsuarioRecord } from "@/models/usuarios"

export function useUsuariosController(onToast: (m: string, s: string) => void) {
  const [usuarios, setUsuarios] = useState<UsuarioRecord[]>(USUARIOS_INIT)
  const [search, setSearch] = useState("")
  const [filterEst, setFilterEst] = useState("todos")
  const [page, setPage] = useState(1)
  const [modalUser, setModalUser] = useState<UsuarioRecord | null | undefined>(
    undefined,
  )
  const PAGE_SIZE = 6

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

  const handleSave = (u: UsuarioRecord) => {
    setUsuarios((prev) =>
      prev.some((p) => p.id === u.id)
        ? prev.map((p) => (p.id === u.id ? u : p))
        : [...prev, u],
    )
    onToast(modalUser ? "Usuario actualizado" : "Usuario registrado", u.nombre)
    setPage(1)
  }

  const toggleEstado = (id: string) => {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, estado: u.estado === "Activo" ? "Inactivo" : "Activo" }
          : u,
      ),
    )
    const u = usuarios.find((u) => u.id === id)!
    onToast(
      `Usuario ${u.estado === "Activo" ? "desactivado" : "activado"}`,
      u.nombre,
    )
  }

  const totActivos = usuarios.filter((u) => u.estado === "Activo").length
  const totInactivos = usuarios.filter((u) => u.estado === "Inactivo").length
  const totAcceso = usuarios.filter((u) => u.tieneAcceso).length

  return {
    usuarios,
    setUsuarios,
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
