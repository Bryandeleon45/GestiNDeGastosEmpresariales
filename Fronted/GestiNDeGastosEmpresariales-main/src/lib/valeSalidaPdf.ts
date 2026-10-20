import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { PDFFont, PDFImage, PDFPage, RGB } from "pdf-lib"
import escudoUrl from "@/imports/escudo-panajachel.png"

// Generador del Vale de Salida en PDF (formato carta, reproduciendo el
// diseño del documento de referencia: letterhead con escudo, tabla
// VALE No., cuadrícula de cantidades, justificación subrayada y firmas).
// Devuelve un Blob listo para previsualizar, imprimir o descargar.

const ANCHO = 612
const ALTO = 792
const MARGEN = 48

const NEGRO = rgb(0.1216, 0.1608, 0.2157) // #1F2937
const GRIS_LINEA = rgb(0.2, 0.2, 0.2)

// Helvetica WinAnsi: normaliza ruidos tipográficos.
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

async function cargarEscudo(): Promise<Uint8Array | null> {
  try {
    const res = await fetch(escudoUrl)
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  } catch {
    return null
  }
}

function centro(p: PDFPage, texto: string, y: number, tam: number, fuente: PDFFont, color: RGB) {
  p.drawText(limpiar(texto), {
    x: (ANCHO - fuente.widthOfTextAtSize(limpiar(texto), tam)) / 2,
    y,
    size: tam,
    font: fuente,
    color,
  })
}

function derecha(p: PDFPage, texto: string, xFin: number, y: number, tam: number, fuente: PDFFont, color: RGB) {
  p.drawText(limpiar(texto), {
    x: xFin - fuente.widthOfTextAtSize(limpiar(texto), tam),
    y,
    size: tam,
    font: fuente,
    color,
  })
}

export interface DatosValeSalida {
  id_vale_salida: number
  fecha_salida: string
  justificacion: string | null
  nombre_dependencia?: string | null
  nombre_solicitante?: string | null
  items: Array<{
    cantidad_salida: number
    descripcion: string | null
    observacion: string | null
  }>
}

export async function generarValeSalidaPdf(vale: DatosValeSalida): Promise<Blob> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Vale de Salida S-2026-${vale.id_vale_salida}`)
  doc.setAuthor("Municipalidad de Panajachel")
  doc.setSubject("Vale de Salida")
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

  const p = doc.addPage([ANCHO, ALTO])

  // ─── ATT (arriba a la derecha) ─────────────────────────────────────────────
  const solicitante = (vale.nombre_solicitante ?? "").trim()
  if (solicitante) {
    derecha(p, `ATT: ${solicitante.toUpperCase()}`, ANCHO - MARGEN, 744, 11, neg, NEGRO)
  }

  // ─── Escudo centrado ───────────────────────────────────────────────────────
  const ladoEscudo = 52
  if (escudo) {
    p.drawImage(escudo, {
      x: (ANCHO - ladoEscudo) / 2,
      y: 688,
      width: ladoEscudo,
      height: ladoEscudo,
    })
  }

  // ─── Encabezado municipal ──────────────────────────────────────────────────
  centro(p, "MUNICIPALIDAD DE PANAJACHEL, SOLOLA.", 672, 13, neg, NEGRO)
  centro(p, "TELEFONO 7762-1081", 656, 11, neg, NEGRO)

  const f = new Date(vale.fecha_salida)
  const dia = f.getDate()
  const mes = f.toLocaleDateString("es-GT", { month: "long" }).toUpperCase()
  const anio = String(f.getFullYear())
  const anioFmt = `${anio.slice(0, 1)},${anio.slice(1)}` // "2,026" como el documento
  centro(p, `PANAJACHEL ${dia} DE ${mes} DEL AÑO ${anioFmt}`, 640, 11, neg, NEGRO)

  // ─── Tabla [VALE No. | número | dependencia] ───────────────────────────────
  const tablaY = 612
  const tablaAlto = 20
  const col1 = 78
  const col2 = 150
  const tablaAncho = ANCHO - MARGEN * 2
  p.drawRectangle({
    x: MARGEN,
    y: tablaY,
    width: tablaAncho,
    height: tablaAlto,
    borderColor: GRIS_LINEA,
    borderWidth: 1,
  })
  // Divisores verticales
  p.drawLine({
    start: { x: MARGEN + col1, y: tablaY },
    end: { x: MARGEN + col1, y: tablaY + tablaAlto },
    thickness: 1,
    color: GRIS_LINEA,
  })
  p.drawLine({
    start: { x: MARGEN + col1 + col2, y: tablaY },
    end: { x: MARGEN + col1 + col2, y: tablaY + tablaAlto },
    thickness: 1,
    color: GRIS_LINEA,
  })
  // Textos centrados en cada celda (linea base centrada verticalmente)
  const cellCenter = (texto: string, x0: number, w: number) => {
    const tam = 11
    const tw = neg.widthOfTextAtSize(limpiar(texto), tam)
    p.drawText(limpiar(texto), {
      x: x0 + (w - tw) / 2,
      y: tablaY + (tablaAlto - tam) / 2 + 2,
      size: tam,
      font: neg,
      color: NEGRO,
    })
  }
  cellCenter("VALE No.", MARGEN, col1)
  cellCenter(`S-2026-${vale.id_vale_salida}`, MARGEN + col1, col2)
  cellCenter((vale.nombre_dependencia ?? "").toUpperCase(), MARGEN + col1 + col2, tablaAncho - col1 - col2)

  // ─── POR: + cuadrícula de items ────────────────────────────────────────────
  p.drawText("POR:", { x: MARGEN, y: tablaY - 24, size: 11, font: neg, color: NEGRO })

  const items = vale.items ?? []
  const filas = Math.max(items.length, 20)
  const gridTop = tablaY - 34
  const zonaFirmas = 200 // deja espacio para justificación + firmas
  const rowH = Math.min(15.5, (gridTop - zonaFirmas) / filas)
  const gridX = MARGEN + 6
  const colCant = 64 // ancho de la columna de cantidades
  const gridAlto = filas * rowH

  // Marco de la columna de cantidades (vertical completa + top)
  p.drawLine({
    start: { x: gridX, y: gridTop - gridAlto },
    end: { x: gridX, y: gridTop },
    thickness: 1,
    color: GRIS_LINEA,
  })
  p.drawLine({
    start: { x: gridX + colCant, y: gridTop - gridAlto },
    end: { x: gridX + colCant, y: gridTop },
    thickness: 1,
    color: GRIS_LINEA,
  })
  p.drawLine({
    start: { x: gridX, y: gridTop },
    end: { x: gridX + colCant, y: gridTop },
    thickness: 1,
    color: GRIS_LINEA,
  })

  const tamDesc = 10.5
  for (let i = 0; i < filas; i++) {
    const yRow = gridTop - (i + 1) * rowH
    // Separador horizontal de la fila
    p.drawLine({
      start: { x: gridX, y: yRow },
      end: { x: gridX + colCant, y: yRow },
      thickness: 1,
      color: GRIS_LINEA,
    })
    const it = items[i]
    if (!it) continue
    const yText = yRow + (rowH - 10) / 2 + 1.5

    // Cantidad alineada a la derecha dentro de la columna
    const cant = String(Number(it.cantidad_salida) || 0)
    derecha(p, cant, gridX + colCant - 7, yText, 10.5, neg, NEGRO)

    // Descripción en MAYÚSCULAS a la derecha de la columna
    const base = (it.descripcion ?? "INSUMO").toUpperCase()
    const obs = (it.observacion ?? "").trim()
    const linea = obs ? `${base} - ${obs.toUpperCase()}` : base
    let desc = limpiar(linea)
    const maxDesc = ANCHO - MARGEN - (gridX + colCant + 10)
    if (neg.widthOfTextAtSize(desc, tamDesc) > maxDesc) {
      while (desc.length > 1 && neg.widthOfTextAtSize(`${desc}...`, tamDesc) > maxDesc) {
        desc = desc.slice(0, -1)
      }
      desc = `${desc}...`
    }
    p.drawText(desc, { x: gridX + colCant + 10, y: yText, size: tamDesc, font: neg, color: NEGRO })
  }

  // ─── Justificación subrayada ───────────────────────────────────────────────
  const justY = gridTop - gridAlto - 24
  const textoJust = (vale.justificacion ?? "").trim()
  if (textoJust) {
    const anchoJust = ANCHO - MARGEN * 2 - 48
    const lineas = envolver(textoJust.toUpperCase(), neg, 11, anchoJust).slice(0, 2)
    lineas.forEach((ln, i) => {
      const y = justY - i * 17
      p.drawText(limpiar(ln), { x: MARGEN + 30, y, size: 11, font: neg, color: NEGRO })
      p.drawLine({
        start: { x: MARGEN + 22, y: y - 3 },
        end: { x: ANCHO - MARGEN - 6, y: y - 3 },
        thickness: 0.8,
        color: GRIS_LINEA,
      })
    })
  }

  // ─── Firmas ────────────────────────────────────────────────────────────────
  const yFirma = 112
  const anchoLineaFirma = 190

  // Izquierda: Encargado de Compras y Bodega
  const xIzq = MARGEN
  p.drawText("F.", { x: xIzq, y: yFirma, size: 11, font: reg, color: NEGRO })
  p.drawLine({
    start: { x: xIzq + 14, y: yFirma + 3 },
    end: { x: xIzq + 14 + anchoLineaFirma, y: yFirma + 3 },
    thickness: 0.9,
    color: GRIS_LINEA,
  })
  p.drawText(limpiar("ENCARGADO DE COMPRAS Y BODEGA"), {
    x: xIzq,
    y: yFirma - 34,
    size: 10.5,
    font: neg,
    color: NEGRO,
  })

  // Derecha: Alcalde Municipal (Vo.Bo.)
  const xDer = ANCHO / 2 + 46
  p.drawText("Vo.Bo.", { x: xDer, y: yFirma, size: 11, font: reg, color: NEGRO })
  p.drawText("F.", { x: xDer + 44, y: yFirma, size: 11, font: reg, color: NEGRO })
  p.drawLine({
    start: { x: xDer + 58, y: yFirma + 3 },
    end: { x: xDer + 58 + anchoLineaFirma, y: yFirma + 3 },
    thickness: 0.9,
    color: GRIS_LINEA,
  })
  p.drawText(limpiar("ALCALDE MUNICIPAL"), {
    x: xDer + 44,
    y: yFirma - 34,
    size: 10.5,
    font: neg,
    color: NEGRO,
  })

  const bytes = await doc.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" })
}
