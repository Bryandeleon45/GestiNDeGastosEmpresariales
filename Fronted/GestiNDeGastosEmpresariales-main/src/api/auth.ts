import { api, setToken, getToken } from "./client"

export interface SessionUser {
  id_usuario: number
  nombre_usuario: string
  correo: string
  id_rol: number
  nombre_completo: string
  rol: string
  tipo_usuario?: string | null
  foto?: string | null
}

export interface MenuSubmenu {
  id: number
  nombre: string
  controlador: string
  vista: string
  icono: string
}

export interface MenuItem {
  id: number
  nombre: string
  icono: string
  submenus: MenuSubmenu[]
}

export interface AuthResult {
  token: string
  menu: MenuItem[]
  debe_cambiar_clave: boolean
  user: SessionUser
}

const USER_KEY = "muni_user"
const MENU_KEY = "muni_menu"

export function getStoredUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function updateStoredUser(patch: Partial<SessionUser>): SessionUser | null {
  const current = getStoredUser()
  if (!current) return null
  const next = { ...current, ...patch }
  localStorage.setItem(USER_KEY, JSON.stringify(next))
  return next
}

export function getStoredMenu(): MenuItem[] {
  const raw = localStorage.getItem(MENU_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as MenuItem[]
  } catch {
    return []
  }
}

export async function login(
  usuario: string,
  password: string,
): Promise<AuthResult> {
  const res = await api.post<AuthResult>("/auth/login", { usuario, password })
  setToken(res.token)
  localStorage.setItem(USER_KEY, JSON.stringify(res.user))
  localStorage.setItem(MENU_KEY, JSON.stringify(res.menu))
  return res
}

export async function cambiarClave(
  clave_actual: string,
  clave_nueva: string,
): Promise<void> {
  await api.post("/auth/cambiar-clave", { clave_actual, clave_nueva })
}

export async function recuperarContrasena(
  correo: string,
): Promise<{ ok: boolean; dev_codigo?: string }> {
  return api.post<{ ok: boolean; dev_codigo?: string }>("/auth/recuperar", { correo })
}

export async function restablecerContrasena(
  codigo: string,
  claveNueva: string,
): Promise<void> {
  await api.post("/auth/restablecer", { codigo, clave_nueva: claveNueva })
}

export async function logout(): Promise<void> {
  try {
    if (getToken()) await api.post("/auth/logout")
  } catch {
    // ignore
  } finally {
    setToken(null)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(MENU_KEY)
  }
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function esProveedor(user: SessionUser | null): boolean {
  if (!user) return false
  if (user.tipo_usuario != null) return user.tipo_usuario === "PROVEEDOR"
  const rol = (user.rol || "").toLowerCase().trim()
  return rol === "proveedor" || rol.includes("proveedor")
}