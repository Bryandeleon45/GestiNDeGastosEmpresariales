import { PDFDocument, StandardFonts, rgb, ColorTypes } from "pdf-lib"
import type { PDFFont, PDFImage, PDFPage, RGB } from "pdf-lib"
import type { ColumnaReporte } from "@/api/reportes"
import escudoUrl from "@/imports/escudo-panajachel.png"

// Generador genérico de reportes del módulo en PDF (formato carta, letterhead
// municipal verde, tarjetas de totales, tabla paginada dinámica y firmas).
// Devuelve un Blob listo para previsualizar o descargar.

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

const LIMITE_INFERIOR = 68
const ALTO_FILA = 19

const LABEL_TOTALES: Record<string, string> = {
  montoTotal: "Monto total",
  solicitudes: "Solicitudes",
  ordenes: "Órdenes",
  comprometido: "Comprometido",
  adjudicado: "Adjudicado",
  insumos: "Insumos",
  stock_total: "Stock total",
}
const CLAVES_Q = new Set(["montoTotal", "comprometido", "adjudicado"])

function limpiar(t: string): string {
  return t
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?")
}

function fechaLarga(d = new Date()): string {
  return d.toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })
}

function q(valor: string | number | null | undefined): string {
  const n = Number(valor ?? 0)
  return `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function entero(valor: string | number | null | undefined): string {
  return Number(valor ?? 0).toLocaleString("es-GT")
}

function cortar(texto: string, fuente: PDFFont, tam: number, anchoMax: number): string {
  const t = limpiar(texto)
  if (t.length <= 1) return t
  if (fuente.widthOfTextAtSize(t, tam) <= anchoMax) return t
  let s = t
  while (s.length > 1 && fuente.widthOfTextAtSize(`${s}…`, tam) > anchoMax) s = s.slice(0, -1)
  return `${s}…`
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

export interface DatosReportesPdf {
  codigo: string
  titulo: string
  categoria: string
  columnas: ColumnaReporte[]
  filas: Array<Record<string, string | number | null>>
  totales: Record<string, string | number> | null
  filtrosAplicados: string[]
}

export async function generarReportesPdf(datos: DatosReportesPdf): Promise<Blob> {
  const { codigo, titulo, categoria, columnas, filas, totales, filtrosAplicados } = datos

  const doc = await PDFDocument.create()
  doc.setTitle(`${codigo} - ${titulo}`)
  doc.setAuthor("Municipalidad de Panajachel")
  doc.setSubject(titulo)
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

  const emitido = new Date()

  // ─── Encabezados de página ──────────────────────────────────────────────────
  const encabezadoPortada = (p: PDFPage) => {
    p.drawRectangle({ x: 0, y: ALTO - 136, width: ANCHO, height: 136, color: VERDE })

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
    p.drawText(cortar(titulo, neg, 13, ANCHO - MARGEN - xTexto - 150), {
      x: xTexto,
      y: ALTO - 92,
      size: 13,
      font: neg,
      color: BLANCO,
    })
    p.drawText(limpiar(`${codigo} · ${categoria} · Módulo de Reportes`), {
      x: xTexto,
      y: ALTO - 107,
      size: 8.5,
      font: reg,
      color: VERDE_TEXTO_CLARO,
    })

    const meta = [
      `Emitido: ${fechaLarga(emitido)}`,
      `Registros: ${filas.length}`,
      `Filtros: ${filtrosAplicados.length}`,
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
    const der = cortar(titulo, reg, 8.5, 250)
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

  const dibujarEncabezadoTabla = () => {
    const altoHead = 20
    pagina.drawRectangle({ x: MARGEN, y: y - altoHead, width: ANCHO_UTIL, height: altoHead, color: VERDE })
    let x = MARGEN
    columnas.forEach((c, i) => {
      const t = cortar(c.titulo.toUpperCase(), neg, 6.8, anchosCols[i] - 14)
      pagina.drawText(t, { x: x + 7, y: y - 13.5, size: 6.8, font: neg, color: BLANCO })
      x += anchosCols[i]
    })
    y -= altoHead
  }

  const asegurarEspacio = (necesario: number, repetirTabla = false) => {
    if (y - necesario >= LIMITE_INFERIOR) return
    pagina = doc.addPage([ANCHO, ALTO])
    encabezadoContinuacion(pagina)
    y = ALTO - 66
    if (repetirTabla) {
      dibujarEncabezadoTabla()
    }
  }

  // ─── Tarjetas de totales ────────────────────────────────────────────────────
  const entradas = totales ? Object.entries(totales) : []
  if (entradas.length > 0) {
    const porFila = Math.min(entradas.length, 3)
    const altoKpi = 56
    const gap = 10
    const anchoKpi = (ANCHO_UTIL - (porFila - 1) * gap) / porFila
    for (let i = 0; i < entradas.length; i += porFila) {
      const bloque = entradas.slice(i, i + porFila)
      asegurarEspacio(altoKpi + 10)
      bloque.forEach((k, j) => {
        const clave = k[0]
        const valor = k[1]
        const x = MARGEN + j * (anchoKpi + gap)
        pagina.drawRectangle({
          x,
          y: y - altoKpi,
          width: anchoKpi,
          height: altoKpi,
          color: GRIS_FILA,
          borderColor: GRIS_BORDE,
          borderWidth: 1,
        })
        pagina.drawRectangle({ x, y: y - altoKpi, width: 3.5, height: altoKpi, color: VERDE })
        pagina.drawText(limpiar((LABEL_TOTALES[clave] ?? clave).toUpperCase()), {
          x: x + 12,
          y: y - 16,
          size: 6.2,
          font: neg,
          color: SUAVE,
        })
        const valorTxt = CLAVES_Q.has(clave) ? q(valor) : entero(valor)
        const tamValor = valorTxt.length > 10 ? 10.5 : 13
        pagina.drawText(cortar(valorTxt, neg, tamValor, anchoKpi - 24), {
          x: x + 12,
          y: y - 36,
          size: tamValor,
          font: neg,
          color: VERDE,
        })
        pagina.drawText(clave === "montoTotal" ? "Calculado sobre los registros" : "Dato del sistema", {
          x: x + 12,
          y: y - 49,
          size: 5.8,
          font: reg,
          color: SUAVE,
        })
      })
      y -= altoKpi + 14
    }
    y -= 10
  }

  // ─── Sección: detalle del reporte ───────────────────────────────────────────
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
      pagina.drawText(cortar(sub, reg, 8, ANCHO_UTIL), {
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

  const subtitulo = [
    `Filtros: ${filtrosAplicados.length ? filtrosAplicados.join(" · ") : "sin filtros (todo el histórico)"}`,
    `Registros: ${filas.length} · Moneda: Quetzales (Q)`,
  ].join("  |  ")

  tituloSeccion("Detalle del Reporte", subtitulo)

  // Anchos dinámicos por columna según encabezado y muestras de datos
  const anchosCols: number[] = (() => {
    const n = columnas.length
    if (!n) return []
    const pesos = columnas.map((c) => {
      const muestras = filas.slice(0, 5).map((f) => String(f[c.campo] ?? "").length)
      const maxLen = Math.max(c.titulo.length, ...muestras, 8)
      return Math.min(maxLen, 40)
    })
    const total = pesos.reduce((s, p) => s + p, 0)
    const anchos = pesos.map((p) => Math.max(46, Math.floor((p / total) * ANCHO_UTIL)))
    const dif = ANCHO_UTIL - anchos.reduce((s, a) => s + a, 0)
    const idxAncha = anchos.indexOf(Math.max(...anchos))
    anchos[idxAncha] += dif
    return anchos
  })()

  if (columnas.length > 0) {
    dibujarEncabezadoTabla()

    if (filas.length === 0) {
      asegurarEspacio(24)
      pagina.drawText("No hay datos para los filtros aplicados.", {
        x: MARGEN + 8,
        y: y - 16,
        size: 9,
        font: reg,
        color: SUAVE,
      })
      y -= 28
    }

    filas.forEach((f, idx) => {
      asegurarEspacio(ALTO_FILA, true)
      const yFila = y

      if (idx % 2 === 1) {
        pagina.drawRectangle({ x: MARGEN, y: yFila - ALTO_FILA, width: ANCHO_UTIL, height: ALTO_FILA, color: GRIS_FILA })
      }

      let x = MARGEN
      columnas.forEach((c, i) => {
        const v = f[c.campo]
        const anchoCol = anchosCols[i]
        const esQ = c.campo.includes("monto") || c.campo === "value"
        const esNumero = typeof v === "number"
        const texto = esNumero
          ? esQ
            ? q(v)
            : entero(v)
          : String(v ?? "-")
        const fuente = esNumero ? neg : reg
        const limitado = cortar(texto, fuente, 7.8, anchoCol - 14)
        let xCelda = x + 7
        if (esNumero) {
          xCelda = x + anchoCol - 7 - fuente.widthOfTextAtSize(limitado, 7.8)
        }
        pagina.drawText(limitado, { x: xCelda, y: yFila - 12.5, size: 7.8, font: fuente, color: TEXTO })
        x += anchoCol
      })

      pagina.drawLine({
        start: { x: MARGEN, y: yFila - ALTO_FILA },
        end: { x: ANCHO - MARGEN, y: yFila - ALTO_FILA },
        thickness: 0.4,
        color: GRIS_BORDE,
      })
      y = yFila - ALTO_FILA
    })
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
    { centro: MARGEN + ANCHO_UTIL * 0.28, cargo: "Elaborado por", area: "Unidad de Reportes y Análisis" },
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
      color: rgb(0.612, 0.635, 0.686),
    })
    pagina.drawText(cortar(firma.area, neg, 8.5, anchoLinea), {
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
