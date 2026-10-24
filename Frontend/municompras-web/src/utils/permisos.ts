import { getStoredUser } from "@/api/auth"

const ROLES_GESTION = [
  "Administrador General",
  "Encargado de Almacén",
  "Encargado de Compras",
  "Alcalde Municipal",
]

export function puedeGestionarSolicitudes(): boolean {
  const user = getStoredUser()
  if (!user) return false
  return ROLES_GESTION.includes(user.rol)
}
