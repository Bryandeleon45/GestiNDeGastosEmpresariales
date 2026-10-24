import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { PDFFont, PDFPage } from "pdf-lib"
import { GUIAS, type Guia } from "@/models/ayuda"

// Generador de guías del Centro de Ayuda en PDF (formato carta, estilo formal
// municipal). Los documentos se memorizan por id para no regenerarlos.

const ANCHO = 612
const ALTO = 792
const MARGEN = 54
const VERDE = rgb(0.1176, 0.3686, 0.1843) // #1E5E2F
const VERDE_CLARO = rgb(0.9412, 0.9922, 0.9569) // #F0FDF4
const BORDE_VERDE = rgb(0.7333, 0.9686, 0.8157) // #BBF7D0
const TEXTO = rgb(0.1216, 0.1608, 0.2157) // #1F2937
const SUAVE = rgb(0.4157, 0.4471, 0.502) // #6A7280
const BLANCO_VERDE = rgb(0.851, 0.9255, 0.8745)

const LIMITE_INFERIOR = MARGEN + 36

const cache = new Map<string, Blob>()

function envolver(
  texto: string,
  fuente: PDFFont,
  tam: number,
  anchoMax: number,
): string[] {
  const palabras = texto.split(" ")
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

function fechaLarga(): string {
  return new Date().toLocaleDateString("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function encabezadoPortada(p: PDFPage, guia: Guia, reg: PDFFont, neg: PDFFont) {
  p.drawRectangle({
    x: 0,
    y: ALTO - 128,
    width: ANCHO,
    height: 128,
    color: VERDE,
  })
  p.drawText("MUNICIPALIDAD DE PANAJACHEL", {
    x: MARGEN,
    y: ALTO - 40,
    size: 17,
    font: neg,
    color: rgb(1, 1, 1),
  })
  p.drawText("Sistema de Gestión de Proveedores", {
    x: MARGEN,
    y: ALTO - 57,
    size: 10.5,
    font: reg,
    color: BLANCO_VERDE,
  })
  p.drawLine({
    start: { x: MARGEN, y: ALTO - 68 },
    end: { x: ANCHO - MARGEN, y: ALTO - 68 },
    thickness: 0.8,
    color: rgb(1, 1, 1),
    opacity: 0.35,
  })
  const lineasTitulo = envolver(guia.titulo, neg, 14, ANCHO - MARGEN * 2)
  let yTitulo = ALTO - 90
  for (const linea of lineasTitulo.slice(0, 2)) {
    p.drawText(linea, {
      x: MARGEN,
      y: yTitulo,
      size: 14,
      font: neg,
      color: rgb(1, 1, 1),
    })
    yTitulo -= 18
  }
  p.drawText("Centro de Ayuda · Guía de Usuario", {
    x: MARGEN,
    y: ALTO - 116,
    size: 9,
    font: reg,
    color: BLANCO_VERDE,
  })
  const fecha = `Emitido: ${fechaLarga()}`
  const wFecha = reg.widthOfTextAtSize(fecha, 9)
  p.drawText(fecha, {
    x: ANCHO - MARGEN - wFecha,
    y: ALTO - 116,
    size: 9,
    font: reg,
    color: BLANCO_VERDE,
  })
}

function encabezadoContinuacion(p: PDFPage, reg: PDFFont, neg: PDFFont) {
  p.drawRectangle({
    x: 0,
    y: ALTO - 42,
    width: ANCHO,
    height: 42,
    color: VERDE,
  })
  p.drawText("MUNICIPALIDAD DE PANAJACHEL", {
    x: MARGEN,
    y: ALTO - 27,
    size: 9.5,
    font: neg,
    color: rgb(1, 1, 1),
  })
  p.drawText("Centro de Ayuda · Guía de Usuario", {
    x:
      ANCHO -
      MARGEN -
      reg.widthOfTextAtSize("Centro de Ayuda · Guía de Usuario", 8.5),
    y: ALTO - 27,
    size: 8.5,
    font: reg,
    color: BLANCO_VERDE,
  })
}

export async function generarGuiaPdf(id: string): Promise<Blob> {
  const enCache = cache.get(id)
  if (enCache) return enCache

  const guia = GUIAS.find((g) => g.id === id)
  if (!guia) throw new Error(`Guía no encontrada: ${id}`)

  const doc = await PDFDocument.create()
  doc.setTitle(guia.titulo)
  doc.setAuthor("Municipalidad de Panajachel")
  doc.setSubject("Centro de Ayuda - Guía de Usuario")
  doc.setCreator("Sistema de Gestión de Proveedores")

  const reg = await doc.embedFont(StandardFonts.Helvetica)
  const neg = await doc.embedFont(StandardFonts.HelveticaBold)
  const anchoUtil = ANCHO - MARGEN * 2

  let pagina = doc.addPage([ANCHO, ALTO])
  encabezadoPortada(pagina, guia, reg, neg)
  let y = ALTO - 156

  const nuevaPagina = () => {
    const p = doc.addPage([ANCHO, ALTO])
    encabezadoContinuacion(p, reg, neg)
    return p
  }

  const asegurarEspacio = (necesario: number): PDFPage => {
    if (y - necesario < LIMITE_INFERIOR) {
      pagina = nuevaPagina()
      y = ALTO - 64
    }
    return pagina
  }

  // Introducción
  const lineasIntro = envolver(guia.intro, reg, 10.5, anchoUtil)
  for (const linea of lineasIntro) {
    asegurarEspacio(15)
    pagina.drawText(linea, {
      x: MARGEN,
      y,
      size: 10.5,
      font: reg,
      color: TEXTO,
    })
    y -= 15
  }
  y -= 14

  // Secciones con pasos numerados
  for (const seccion of guia.secciones) {
    asegurarEspacio(46)
    pagina.drawText(seccion.titulo, {
      x: MARGEN,
      y,
      size: 12,
      font: neg,
      color: VERDE,
    })
    const wTitulo = neg.widthOfTextAtSize(seccion.titulo, 12)
    pagina.drawLine({
      start: { x: MARGEN, y: y - 5 },
      end: { x: MARGEN + wTitulo, y: y - 5 },
      thickness: 1,
      color: VERDE,
    })
    y -= 24

    seccion.pasos.forEach((paso, i) => {
      const numeracion = `${i + 1}.`
      const lineas = envolver(paso, reg, 10.5, anchoUtil - 22)
      const altoBloque = lineas.length * 15 + 6
      asegurarEspacio(altoBloque)
      pagina.drawText(numeracion, {
        x: MARGEN,
        y,
        size: 10.5,
        font: neg,
        color: VERDE,
      })
      let yPaso = y
      for (const linea of lineas) {
        pagina.drawText(linea, {
          x: MARGEN + 22,
          y: yPaso,
          size: 10.5,
          font: reg,
          color: TEXTO,
        })
        yPaso -= 15
      }
      y = yPaso - 6
    })
    y -= 8
  }

  // Caja de notas
  if (guia.notas.length) {
    const lineasNotas: { linea: string; esPrimera: boolean }[] = []
    for (const nota of guia.notas) {
      const envueltas = envolver(`•  ${nota}`, reg, 10, anchoUtil - 32)
      envueltas.forEach((linea, idx) =>
        lineasNotas.push({ linea, esPrimera: idx === 0 }),
      )
    }
    const altoCaja = 22 + lineasNotas.length * 14 + 14
    asegurarEspacio(altoCaja + 8)
    const yCaja = y
    pagina.drawRectangle({
      x: MARGEN - 6,
      y: yCaja - altoCaja + 12,
      width: anchoUtil + 12,
      height: altoCaja,
      color: VERDE_CLARO,
      borderColor: BORDE_VERDE,
      borderWidth: 1,
    })
    pagina.drawText("Notas", {
      x: MARGEN + 8,
      y: yCaja - 2,
      size: 10.5,
      font: neg,
      color: VERDE,
    })
    let yNota = yCaja - 20
    for (const { linea, esPrimera } of lineasNotas) {
      pagina.drawText(linea, {
        x: MARGEN + (esPrimera ? 8 : 22),
        y: yNota,
        size: 10,
        font: reg,
        color: TEXTO,
      })
      yNota -= 14
    }
    y = yCaja - altoCaja
  }

  // Pie de página en todas las hojas
  const paginas = doc.getPages()
  const total = paginas.length
  paginas.forEach((p, i) => {
    p.drawLine({
      start: { x: MARGEN, y: 50 },
      end: { x: ANCHO - MARGEN, y: 50 },
      thickness: 0.6,
      color: SUAVE,
      opacity: 0.5,
    })
    p.drawText("MUNICIPALIDAD DE PANAJACHEL · Centro de Ayuda", {
      x: MARGEN,
      y: 38,
      size: 8,
      font: reg,
      color: SUAVE,
    })
    const numero = `Página ${i + 1} de ${total}`
    p.drawText(numero, {
      x: ANCHO - MARGEN - reg.widthOfTextAtSize(numero, 8),
      y: 38,
      size: 8,
      font: reg,
      color: SUAVE,
    })
  })

  const bytes = await doc.save()
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  })
  cache.set(id, blob)
  return blob
}
