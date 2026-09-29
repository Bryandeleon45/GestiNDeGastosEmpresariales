import { api, setToken, getToken } from "./client"

export interface SessionUser {
  id_usuario: number
  nombre_usuario: string
  correo: string
  id_rol: number
  nombre_completo: string
  rol: string
}

export interface AuthResult {
  token: string
  menu: unknown[]
  debe_cambiar_clave: boolean
  user: SessionUser
}

const USER_KEY = "muni_user"

export function getStoredUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export async function login(
  usuario: string,
  password: string,
): Promise<AuthResult> {
  const res = await api.post<AuthResult>("/auth/login", { usuario, password })
  setToken(res.token)
  localStorage.setItem(USER_KEY, JSON.stringify(res.user))
  return res
}

export async function logout(): Promise<void> {
  try {
    if (getToken()) await api.post("/auth/logout")
  } catch {
    // ignore
  } finally {
    setToken(null)
    localStorage.removeItem(USER_KEY)
  }
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
