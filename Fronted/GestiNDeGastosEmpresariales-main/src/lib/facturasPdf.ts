import { PDFDocument, StandardFonts, rgb, ColorTypes } from "pdf-lib"
import type { PDFFont, PDFImage, PDFPage, RGB } from "pdf-lib"
import type { Factura, ResumenFacturacion, CronogramaItem } from "@/api/facturacion"
import escudoUrl from "@/imports/escudo-panajachel.png"

// Generador del reporte de Facturación y Órdenes de Pago en PDF (formato
// carta, letterhead municipal verde, KPIs, tabla paginada con badges de
// estado, cronograma de pagos y firmas). Devuelve un Blob listo para
// previsualizar o descargar.

const ANCHO = 612
const ALTO = 792
const MARGEN = 48
const ANCHO_UTIL = ANCHO - MARGEN * 2

const VERDE = rgb(0.1176, 0.3686, 0.1843) // #1E5E2F
const VERDE_CLARO = rgb(0.9412, 0.9922, 0.9569) // #F0FDF4
const VERDE_BORDE = rgb(0.7333, 0.9686, 0.8157) // #BBF7D0
const VERDE_TEXTO_CLARO = rgb(0.851, 0.9255, 0.8745) // #D9ECE0
const TEXTO = rgb(0.1216, 0.1608, 0.2157) // #1F2937
const SUAVE = rgb(0.4157, 0.4471, 0.502) // #6A7280
const GRIS_FILA = rgb(0.976, 0.98, 0.984) // #F9FAFB
const GRIS_BORDE = rgb(0.898, 0.906, 0.922) // #E5E7EB
const BLANCO = rgb(1, 1, 1)
const ROJO = rgb(0.863, 0.149, 0.149) // #DC2626
const ROJO_BG = rgb(0.996, 0.886, 0.886) // #FEE2E2
const ROJO_BORDE = rgb(0.996, 0.918, 0.918) // #FDECEC

const LIMITE_INFERIOR = 68

const COLS = {
  factura: { x: MARGEN, w: 92 },
  proveedor: { x: MARGEN + 92, w: 168 },
  fecha: { x: MARGEN + 260, w: 72 },
  monto: { x: MARGEN + 332, w: 86 },
  estado: { x: MARGEN + 418, w: 98 },
}

const hexRgb = (h: string): RGB => ({
  type: ColorTypes.RGB,
  red: parseInt(h.slice(1, 3), 16) / 255,
  green: parseInt(h.slice(3, 5), 16) / 255,
  blue: parseInt(h.slice(5, 7), 16) / 255,
})

const ESTADO_BADGE: Record<string, { bg: RGB; fg: RGB; borde: RGB }> = {
  Pagado: { bg: rgb(0.863, 0.988, 0.906), fg: rgb(0.086, 0.639, 0.29), borde: rgb(0.71, 0.93, 0.78) },
  "Pagado con atraso": { bg: rgb(0.992, 0.902, 0.541), fg: rgb(0.573, 0.251, 0.055), borde: rgb(0.96, 0.83, 0.45) },
  Pendiente: { bg: rgb(0.996, 0.976, 0.765), fg: rgb(0.522, 0.302, 0.055), borde: rgb(0.96, 0.93, 0.66) },
  Vencido: { bg: ROJO_BG, fg: ROJO, borde: ROJO_BORDE },
  Rechazada: { bg: rgb(0.953, 0.957, 0.965), fg: rgb(0.392, 0.455, 0.545), borde: GRIS_BORDE },
}

const ESTADO_CRONO_LABEL: Record<string, string> = {
  Recibida: "Recibida",
  "En Revisión": "En revisión",
  Aprobada: "Aprobada",
  Pendiente: "Pendiente",
  Programada: "Pago programado",
}

// Helvetica usa WinAnsi: normaliza ruidos tipográficos modernos.
function limpiar(t: string): string {
  return t
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?")
}

function envolver(texto: string, fuente: PDFFont, tam: number, anchoMax: number): string[] {
  const palabras = limpiar(texto).split(" ")
  const lineas: string[] = []
  let actual = ""
  for (const p of palabras) {
    const candidato = actual ? `${actual} ${p}` : p
    if (fuente.widthOfTextAtSize(candidato, tam) <= anchoMax) {
      actual = candidato
    } else {
      if (actual) lineas.push(actual)
      actual = p
    }
  }
  if (actual) lineas.push(actual)
  return lineas.length ? lineas : [""]
}

function fechaLarga(d = new Date()): string {
  return d.toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })
}

function fechaCorta(valor: string | null | undefined): string {
  if (!valor) return "-"
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  return valor
}

function q(valor: string | number | null | undefined): string {
  const n = Number(valor ?? 0)
  return `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function numero(valor: string | number | null | undefined): string {
  return Number(valor ?? 0).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function cargarEscudo(): Promise<Uint8Array | null> {
  try {
    const res = await fetch(escudoUrl)
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  } catch {
    return null
  }
}

export interface DatosReporteFacturacion {
  facturas: Factura[]
  resumen: ResumenFacturacion | null
  cronograma: CronogramaItem[]
  filtroEstado: string
}

export async function generarReporteFacturacionPdf(datos: DatosReporteFacturacion): Promise<Blob> {
  const { facturas, resumen, cronograma, filtroEstado } = datos

  const doc = await PDFDocument.create()
  doc.setTitle("Reporte de Facturación y Órdenes de Pago")
  doc.setAuthor("Municipalidad de Panajachel")
  doc.setSubject("Reporte de Facturación")
  doc.setCreator("Sistema de Gestión de Gastos Empresariales")

  const reg = await doc.embedFont(StandardFonts.Helvetica)
  const neg = await doc.embedFont(StandardFonts.HelveticaBold)

  let escudo: PDFImage | null = null
  const bytesEscudo = await cargarEscudo()
  if (bytesEscudo) {
    try {
      escudo = await doc.embedPng(bytesEscudo)
    } catch {
      escudo = null
    }
  }

  const totalMonto = facturas.reduce((s, f) => s + Number(f.monto_total || 0), 0)
  const emitido = new Date()

  // ─── Encabezados de página ──────────────────────────────────────────────────
  const encabezadoPortada = (p: PDFPage) => {
    p.drawRectangle({ x: 0, y: ALTO - 136, width: ANCHO, height: 136, color: VERDE })

    // Badge del escudo
    if (escudo) {
      p.drawRectangle({
        x: MARGEN,
        y: ALTO - 118,
        width: 68,
        height: 68,
        color: BLANCO,
        borderColor: VERDE_BORDE,
        borderWidth: 1.2,
        opacity: 1,
      })
      const maxImg = 52
      const escala = Math.min(maxImg / escudo.width, maxImg / escudo.height)
      const w = escudo.width * escala
      const h = escudo.height * escala
      p.drawImage(escudo, {
        x: MARGEN + (68 - w) / 2,
        y: ALTO - 118 + (68 - h) / 2,
        width: w,
        height: h,
      })
    }

    const xTexto = escudo ? MARGEN + 84 : MARGEN
    p.drawText("MUNICIPALIDAD DE PANAJACHEL", {
      x: xTexto,
      y: ALTO - 44,
      size: 16,
      font: neg,
      color: BLANCO,
    })
    p.drawText("Sistema de Gestión de Gastos Empresariales", {
      x: xTexto,
      y: ALTO - 60,
      size: 10,
      font: reg,
      color: VERDE_TEXTO_CLARO,
    })
    p.drawLine({
      start: { x: xTexto, y: ALTO - 70 },
      end: { x: ANCHO - MARGEN, y: ALTO - 70 },
      thickness: 0.8,
      color: BLANCO,
      opacity: 0.4,
    })
    p.drawText("Reporte de Facturación y Órdenes de Pago", {
      x: xTexto,
      y: ALTO - 92,
      size: 13,
      font: neg,
      color: BLANCO,
    })
    p.drawText("Unidad de Facturación · Administración Municipal", {
      x: xTexto,
      y: ALTO - 107,
      size: 8.5,
      font: reg,
      color: VERDE_TEXTO_CLARO,
    })

    // Metadatos alineados a la derecha
    const meta = [
      `Emitido: ${fechaLarga(emitido)}`,
      `Filtro: ${filtroEstado === "Todos" ? "Todos los estados" : filtroEstado}`,
      `Registros: ${facturas.length}`,
    ]
    meta.forEach((linea, i) => {
      const w = reg.widthOfTextAtSize(linea, 8.5)
      p.drawText(linea, {
        x: ANCHO - MARGEN - w,
        y: ALTO - 44 - i * 13,
        size: 8.5,
        font: reg,
        color: VERDE_TEXTO_CLARO,
      })
    })
  }

  const encabezadoContinuacion = (p: PDFPage) => {
    p.drawRectangle({ x: 0, y: ALTO - 44, width: ANCHO, height: 44, color: VERDE })
    if (escudo) {
      const maxImg = 24
      const escala = Math.min(maxImg / escudo.width, maxImg / escudo.height)
      p.drawImage(escudo, {
        x: MARGEN,
        y: ALTO - 34,
        width: escudo.width * escala,
        height: escudo.height * escala,
      })
    }
    const xTexto = escudo ? MARGEN + 32 : MARGEN
    p.drawText("MUNICIPALIDAD DE PANAJACHEL", {
      x: xTexto,
      y: ALTO - 27,
      size: 9.5,
      font: neg,
      color: BLANCO,
    })
    const der = "Reporte de Facturación y Órdenes de Pago"
    p.drawText(der, {
      x: ANCHO - MARGEN - reg.widthOfTextAtSize(der, 8.5),
      y: ALTO - 27,
      size: 8.5,
      font: reg,
      color: VERDE_TEXTO_CLARO,
    })
  }

  // ─── Construcción del documento ─────────────────────────────────────────────
  let pagina = doc.addPage([ANCHO, ALTO])
  encabezadoPortada(pagina)
  let y = ALTO - 158

  const asegurarEspacio = (necesario: number, repetirTabla = false) => {
    if (y - necesario >= LIMITE_INFERIOR) return
    pagina = doc.addPage([ANCHO, ALTO])
    encabezadoContinuacion(pagina)
    y = ALTO - 66
    if (repetirTabla) {
      dibujarEncabezadoTabla()
    }
  }

  // ─── Tarjetas KPI ──────────────────────────────────────────────────────────
  const kpis: { label: string; valor: string; sub: string; acento?: RGB; fondo?: RGB; borde?: RGB }[] = [
    { label: "TOTAL PAGADO (MES)", valor: q(resumen?.total_por_pagar ?? 0), sub: "Pagos ejecutados en el mes", acento: VERDE, fondo: hexRgb("#F0FDF4"), borde: VERDE_BORDE },
    { label: "FACTURAS PENDIENTES", valor: String(resumen?.facturas_pendientes ?? 0), sub: "En el flujo de revisión", acento: hexRgb("#374151"), fondo: GRIS_FILA, borde: GRIS_BORDE },
    { label: "EN REVISIÓN", valor: String(resumen?.en_revision ?? 0), sub: "Validación técnica en curso", acento: hexRgb("#92400E"), fondo: hexRgb("#FFFBEB"), borde: hexRgb("#FDE68A") },
    { label: "VENCIMIENTOS PRÓXIMOS", valor: String(resumen?.vencimientos_proximos ?? 0).padStart(2, "0"), sub: "Requiere acción inmediata", acento: ROJO, fondo: rgb(0.996, 0.949, 0.949), borde: ROJO_BORDE },
  ]

  const altoKpi = 56
  const anchoKpi = (ANCHO_UTIL - 30) / 4
  kpis.forEach((kpi, i) => {
    const x = MARGEN + i * (anchoKpi + 10)
    pagina.drawRectangle({
      x,
      y: y - altoKpi,
      width: anchoKpi,
      height: altoKpi,
      color: kpi.fondo ?? GRIS_FILA,
      borderColor: kpi.borde ?? GRIS_BORDE,
      borderWidth: 1,
    })
    pagina.drawRectangle({ x, y: y - altoKpi, width: 3.5, height: altoKpi, color: kpi.acento ?? VERDE })
    pagina.drawText(limpiar(kpi.label), {
      x: x + 12,
      y: y - 16,
      size: 6.2,
      font: neg,
      color: SUAVE,
    })
    const tamValor = kpi.valor.length > 9 ? 10.5 : 13
    pagina.drawText(limpiar(kpi.valor), {
      x: x + 12,
      y: y - 36,
      size: tamValor,
      font: neg,
      color: kpi.acento ?? TEXTO,
    })
    pagina.drawText(limpiar(kpi.sub), {
      x: x + 12,
      y: y - 49,
      size: 5.8,
      font: reg,
      color: SUAVE,
    })
  })
  y -= altoKpi + 26

  // ─── Sección: detalle de facturas ──────────────────────────────────────────
  const tituloSeccion = (texto: string, sub = "") => {
    asegurarEspacio(sub ? 40 : 28)
    pagina.drawText(limpiar(texto), {
      x: MARGEN,
      y,
      size: 11.5,
      font: neg,
      color: VERDE,
    })
    const w = neg.widthOfTextAtSize(limpiar(texto), 11.5)
    pagina.drawLine({
      start: { x: MARGEN, y: y - 5 },
      end: { x: MARGEN + w, y: y - 5 },
      thickness: 1.1,
      color: VERDE,
    })
    if (sub) {
      pagina.drawText(limpiar(sub), {
        x: MARGEN,
        y: y - 17,
        size: 8,
        font: reg,
        color: SUAVE,
      })
      y -= 17
    }
    y -= 17
  }

  tituloSeccion(
    "Detalle de Facturas y Pagos",
    `Se listan ${facturas.length} registro(s) · Moneda: Quetzales (Q)`,
  )

  const ALTO_FILA = 27
  const dibujarEncabezadoTabla = () => {
    const altoHead = 20
    pagina.drawRectangle({ x: MARGEN, y: y - altoHead, width: ANCHO_UTIL, height: altoHead, color: VERDE })
    const encabezados: [string, { x: number; w: number }, "left" | "right" | "center"][] = [
      ["NO. FACTURA", COLS.factura, "left"],
      ["PROVEEDOR", COLS.proveedor, "left"],
      ["FECHA EMISIÓN", COLS.fecha, "left"],
      ["MONTO (Q)", COLS.monto, "right"],
      ["ESTADO", COLS.estado, "center"],
    ]
    for (const [texto, col, alin] of encabezados) {
      const t = limpiar(texto)
      let x = col.x + 8
      if (alin === "right") x = col.x + col.w - 8 - neg.widthOfTextAtSize(t, 6.8)
      if (alin === "center") x = col.x + (col.w - neg.widthOfTextAtSize(t, 6.8)) / 2
      pagina.drawText(t, { x, y: y - 13.5, size: 6.8, font: neg, color: BLANCO })
    }
    y -= altoHead
  }

  dibujarEncabezadoTabla()

  if (facturas.length === 0) {
    asegurarEspacio(24)
    pagina.drawText("No hay facturas registradas con el filtro seleccionado.", {
      x: MARGEN + 8,
      y: y - 16,
      size: 9,
      font: reg,
      color: SUAVE,
    })
    y -= 28
  }

  facturas.forEach((f, idx) => {
    asegurarEspacio(ALTO_FILA, true)
    const yFila = y

    if (idx % 2 === 1) {
      pagina.drawRectangle({ x: MARGEN, y: yFila - ALTO_FILA, width: ANCHO_UTIL, height: ALTO_FILA, color: GRIS_FILA })
    }

    const numFactura = limpiar(`${f.serie ? `${f.serie}-` : ""}${f.numero_factura}`)
    const proveedor = limpiar(f.razon_social || "-")

    // Línea 1
    pagina.drawText(numFactura.length > 18 ? `${numFactura.slice(0, 17)}…` : numFactura, {
      x: COLS.factura.x + 8,
      y: yFila - 12,
      size: 8.2,
      font: neg,
      color: TEXTO,
    })
    pagina.drawText(proveedor.length > 36 ? `${proveedor.slice(0, 35)}…` : proveedor, {
      x: COLS.proveedor.x + 8,
      y: yFila - 12,
      size: 8.2,
      font: reg,
      color: TEXTO,
    })
    pagina.drawText(fechaCorta(f.fecha_emision), {
      x: COLS.fecha.x + 8,
      y: yFila - 12,
      size: 8.2,
      font: reg,
      color: TEXTO,
    })
    const montoTxt = numero(f.monto_total)
    pagina.drawText(montoTxt, {
      x: COLS.monto.x + COLS.monto.w - 8 - neg.widthOfTextAtSize(montoTxt, 8.2),
      y: yFila - 12,
      size: 8.2,
      font: neg,
      color: TEXTO,
    })

    // Badge de estado (centrado en su columna)
    const estado = f.estado_visible || "Pendiente"
    const est = ESTADO_BADGE[estado] ?? ESTADO_BADGE.Pendiente
    const txtEstado = limpiar(estado)
    const anchoBadge = Math.max(neg.widthOfTextAtSize(txtEstado, 6.6) + 14, 50)
    const altoBadge = 14
    const xBadge = COLS.estado.x + (COLS.estado.w - anchoBadge) / 2
    const yBadge = yFila - (ALTO_FILA - altoBadge) / 2
    pagina.drawRectangle({
      x: xBadge,
      y: yBadge - altoBadge,
      width: anchoBadge,
      height: altoBadge,
      color: est.bg,
      borderColor: est.borde,
      borderWidth: 0.8,
    })
    pagina.drawText(txtEstado, {
      x: xBadge + (anchoBadge - neg.widthOfTextAtSize(txtEstado, 6.6)) / 2,
      y: yBadge - 10,
      size: 6.6,
      font: neg,
      color: est.fg,
    })

    // Línea 2
    const sub1 = limpiar(f.numero_orden || "")
    const sub2 = limpiar(`NIT ${f.nit || "-"}`)
    const venceTxt = limpiar(`Vence: ${fechaCorta(f.fecha_vencimiento)}`)
    pagina.drawText(sub1.length > 20 ? `${sub1.slice(0, 19)}…` : sub1, {
      x: COLS.factura.x + 8,
      y: yFila - 23,
      size: 6.6,
      font: reg,
      color: SUAVE,
    })
    pagina.drawText(sub2.length > 36 ? `${sub2.slice(0, 35)}…` : sub2, {
      x: COLS.proveedor.x + 8,
      y: yFila - 23,
      size: 6.6,
      font: reg,
      color: SUAVE,
    })
    pagina.drawText(venceTxt, {
      x: COLS.fecha.x + 8,
      y: yFila - 23,
      size: 6.6,
      font: reg,
      color: SUAVE,
    })

    pagina.drawLine({
      start: { x: MARGEN, y: yFila - ALTO_FILA },
      end: { x: ANCHO - MARGEN, y: yFila - ALTO_FILA },
      thickness: 0.4,
      color: GRIS_BORDE,
    })
    y = yFila - ALTO_FILA
  })

  // Fila de total general
  if (facturas.length > 0) {
    asegurarEspacio(24)
    const altoTotal = 22
    pagina.drawRectangle({
      x: MARGEN,
      y: y - altoTotal,
      width: ANCHO_UTIL,
      height: altoTotal,
      color: VERDE_CLARO,
      borderColor: VERDE_BORDE,
      borderWidth: 1,
    })
    const labelTotal = `TOTAL GENERAL (${facturas.length} factura(s))`
    pagina.drawText(limpiar(labelTotal), {
      x: MARGEN + 10,
      y: y - 14.5,
      size: 8.5,
      font: neg,
      color: VERDE,
    })
    const totalTxt = q(totalMonto)
    pagina.drawText(totalTxt, {
      x: COLS.monto.x + COLS.monto.w - 8 - neg.widthOfTextAtSize(totalTxt, 9.5),
      y: y - 14.5,
      size: 9.5,
      font: neg,
      color: VERDE,
    })
    y -= altoTotal + 24
  }

  // ─── Cronograma de pagos ───────────────────────────────────────────────────
  if (cronograma.length > 0) {
    tituloSeccion(
      "Cronograma de Pagos y Vencimientos",
      "Próximos compromisos registrados en el sistema",
    )
    const items = cronograma.slice(0, 8)
    const altoItem = 17
    const altoCaja = items.length * altoItem + 16
    asegurarEspacio(altoCaja + 8)
    const yCaja = y
    pagina.drawRectangle({
      x: MARGEN - 4,
      y: yCaja - altoCaja + 8,
      width: ANCHO_UTIL + 8,
      height: altoCaja,
      color: VERDE_CLARO,
      borderColor: VERDE_BORDE,
      borderWidth: 1,
    })
    items.forEach((c, i) => {
      const yItem = yCaja - 6 - i * altoItem
      const fechaLim = (c.fecha_pago_programada ?? c.fecha_vencimiento).slice(0, 10)
      const [vy, vm, vd] = fechaLim.split("-").map(Number)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const vencida = Boolean(vy && vm && vd) && new Date(vy, vm - 1, vd) < hoy
      const colorPunto = vencida ? ROJO : VERDE
      const colorTexto = vencida ? ROJO : VERDE
      pagina.drawRectangle({
        x: MARGEN + 6,
        y: yItem - 5,
        width: 5,
        height: 5,
        color: colorPunto,
      })
      pagina.drawText(limpiar(fechaCorta(fechaLim)), {
        x: MARGEN + 18,
        y: yItem - 6,
        size: 7.2,
        font: neg,
        color: colorTexto,
      })
      const estadoLabel = ESTADO_CRONO_LABEL[c.estado] ?? c.estado
      const detalle = limpiar(`${c.razon_social} · ${c.numero_factura} · ${estadoLabel}`)
      const anchoDisp = ANCHO_UTIL - 130
      pagina.drawText(detalle.length > 72 ? `${detalle.slice(0, 71)}…` : detalle, {
        x: MARGEN + 72,
        y: yItem - 6,
        size: 7.2,
        font: reg,
        color: TEXTO,
      })
      const montoC = q(c.monto)
      pagina.drawText(montoC, {
        x: ANCHO - MARGEN - 12 - neg.widthOfTextAtSize(montoC, 7.2),
        y: yItem - 6,
        size: 7.2,
        font: neg,
        color: colorTexto,
      })
      void anchoDisp
    })
    y = yCaja - altoCaja + 8 - 24
  }

  // ─── Firmas ────────────────────────────────────────────────────────────────
  asegurarEspacio(86)
  y -= 10
  pagina.drawText("Firmas de Responsabilidad", {
    x: MARGEN,
    y,
    size: 9,
    font: neg,
    color: TEXTO,
  })
  y -= 34

  const firmas: { centro: number; cargo: string; area: string }[] = [
    { centro: MARGEN + ANCHO_UTIL * 0.28, cargo: "Elaborado por", area: "Unidad de Facturación" },
    { centro: MARGEN + ANCHO_UTIL * 0.72, cargo: "Vo. Bo.", area: "Dirección Administrativa" },
  ]
  const anchoLinea = 180
  for (const firma of firmas) {
    pagina.drawText(firma.cargo, {
      x: firma.centro - reg.widthOfTextAtSize(firma.cargo, 8) / 2,
      y: y + 4,
      size: 8,
      font: reg,
      color: SUAVE,
    })
    pagina.drawLine({
      start: { x: firma.centro - anchoLinea / 2, y: y - 14 },
      end: { x: firma.centro + anchoLinea / 2, y: y - 14 },
      thickness: 0.9,
      color: hexRgb("#9CA3AF"),
    })
    pagina.drawText(limpiar(firma.area), {
      x: firma.centro - neg.widthOfTextAtSize(firma.area, 8.5) / 2,
      y: y - 26,
      size: 8.5,
      font: neg,
      color: TEXTO,
    })
  }

  // ─── Pie de página en todas las hojas ──────────────────────────────────────
  const paginas = doc.getPages()
  const totalPaginas = paginas.length
  paginas.forEach((p, i) => {
    p.drawLine({
      start: { x: MARGEN, y: 50 },
      end: { x: ANCHO - MARGEN, y: 50 },
      thickness: 0.6,
      color: SUAVE,
      opacity: 0.5,
    })
    p.drawText("Municipalidad de Panajachel · Sistema de Gestión de Gastos Empresariales", {
      x: MARGEN,
      y: 38,
      size: 7.5,
      font: reg,
      color: SUAVE,
    })
    const numeroPagina = `Página ${i + 1} de ${totalPaginas}`
    p.drawText(numeroPagina, {
      x: ANCHO - MARGEN - reg.widthOfTextAtSize(numeroPagina, 7.5),
      y: 38,
      size: 7.5,
      font: reg,
      color: SUAVE,
    })
    const aviso = "Documento generado electrónicamente · No requiere firma autógrafa"
    p.drawText(aviso, {
      x: ANCHO / 2 - reg.widthOfTextAtSize(aviso, 6.5) / 2,
      y: 26,
      size: 6.5,
      font: reg,
      color: SUAVE,
    })
  })

  const bytes = await doc.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" })
}
