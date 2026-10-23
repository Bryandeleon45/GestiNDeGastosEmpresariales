export function fmtFecha(iso?: string | null): string {
  if (!iso) return "—"
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${parseInt(m[3], 10)}/${parseInt(m[2], 10)}/${m[1]}`
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-GT", { day: "numeric", month: "numeric", year: "numeric" })
}

export function fmtFechaHora(iso?: string | null): string {
  if (!iso) return "—"
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  const fecha = m ? `${parseInt(m[3], 10)}/${parseInt(m[2], 10)}/${m[1]}` : d.toLocaleDateString("es-GT", { day: "numeric", month: "numeric", year: "numeric" })
  const hora = d.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })
  return `${fecha} ${hora}`
}

export function fmtFechaHoraSec(iso?: string | null): string {
  if (!iso) return "—"
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  const fecha = m ? `${parseInt(m[3], 10)}/${parseInt(m[2], 10)}/${m[1]}` : d.toLocaleDateString("es-GT", { day: "numeric", month: "numeric", year: "numeric" })
  const hora = d.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  return `${fecha} ${hora}`
}

export function fmtHora(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })
}

export function hoyISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function diasRestantes(fecha: string): number | null {
  if (!fecha) return null
  const hoy = new Date(hoyISO() + "T00:00:00")
  const destino = new Date(fecha + "T00:00:00")
  const diff = Math.ceil((destino.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export function fmtFechaLarga(iso?: string | null): string {
  if (!iso) return "—"
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${parseInt(m[3], 10)} de ${mesLargo(parseInt(m[2], 10))} de ${m[1]}`
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })
}

export function fmtFechaCorta(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${parseInt(m[3], 10)}/${parseInt(m[2], 10)}/${m[1]}`
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function mesLargo(m: number): string {
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
  return meses[m - 1] ?? String(m)
}