import type { SolicitudRow } from "@/models/solicitudes"
import type { ResumenKpis } from "@/controllers/useDependenciasController"
import type { Border } from "exceljs"
import escudoUrl from "@/imports/escudo-panajachel.png"

// ─── Paleta institucional (index.css: --brand / --brand-light / --brand-border) ─
const VERDE = "FF1E5E2F"
const VERDE_CLARO = "FFE8F5ED"
const VERDE_BORDE = "FFC6E0CC"
const BLANCO = "FFFFFFFF"
const TEXTO = "FF374151"
const GRIS = "FF6B7280"
const GRIS_CLARO = "FF9CA3AF"
const BORDE = "FFE5E7EB"
const FILA_ALTERNA = "FFF9FAFB"

// ─── Colores espejo de ESTADO_SOL_STYLE / PRIORIDAD_STYLE (models/solicitudes) ─
const ESTADO_COLOR: Record<string, { bg: string; fg: string }> = {
  Pendiente: { bg: "FFF3F4F6", fg: "FF6B7280" },
  "En Revisión": { bg: "FFF0F9FF", fg: "FF0369A1" },
  Aprobada: { bg: "FFF0FDF4", fg: "FF15803D" },
  Rechazada: { bg: "FFFEF2F2", fg: "FFDC2626" },
  "En Compra": { bg: "FFFAF5FF", fg: "FF7E22CE" },
  Cancelada: { bg: "FFF8FAFC", fg: "FF64748B" },
}
const COLOR_NEUTRO = { bg: "FFF3F4F6", fg: "FF4B5563" }
const PRIORIDAD_COLOR: Record<string, { bg: string; fg: string }> = {
  Urgente: { bg: "FFFEF2F2", fg: "FFDC2626" },
  Alta: { bg: "FFFFF7ED", fg: "FFEA580C" },
  Media: { bg: "FFFEFCE8", fg: "FFA16207" },
  Baja: { bg: "FFF3F4F6", fg: "FF4B5563" },
}

const LETRAS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"]

const COLUMNAS = [
  { key: "n", width: 6 },
  { key: "codigo", width: 17 },
  { key: "dependencia", width: 24 },
  { key: "item", width: 46 },
  { key: "cant", width: 12 },
  { key: "prioridad", width: 13 },
  { key: "estado", width: 14 },
  { key: "fecha", width: 13 },
  { key: "solicitante", width: 26 },
]

const ENCABEZADOS = [
  "#",
  "CÓDIGO",
  "DEPENDENCIA",
  "ÍTEM",
  "CANT.",
  "PRIORIDAD",
  "ESTADO",
  "FECHA",
  "SOLICITANTE",
]

const CELDA_BORDE = {
  top: { style: "thin", color: { argb: BORDE } },
  bottom: { style: "thin", color: { argb: BORDE } },
  left: { style: "thin", color: { argb: BORDE } },
  right: { style: "thin", color: { argb: BORDE } },
} as const

const BORDE_MEDIO = {
  top: { style: "medium", color: { argb: VERDE_BORDE } },
  bottom: { style: "medium", color: { argb: VERDE_BORDE } },
  left: { style: "medium", color: { argb: VERDE_BORDE } },
  right: { style: "medium", color: { argb: VERDE_BORDE } },
} as const

// Fila del encabezado de tabla y primera fila de datos
const FILA_ENC = 8
const FILA_DATOS = 9

export interface DatosReporteExcel {
  rows: SolicitudRow[]
  kpis: ResumenKpis
  depFilter: string
  emitidoPor: string
}

function arrayBufferABase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ""
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(bin)
}

async function obtenerLogoBase64(): Promise<string | null> {
  try {
    if (escudoUrl.startsWith("data:")) {
      return escudoUrl.slice(escudoUrl.indexOf(",") + 1)
    }
    const res = await fetch(escudoUrl)
    if (!res.ok) return null
    return arrayBufferABase64(await res.arrayBuffer())
  } catch {
    return null
  }
}

export async function generarExcelSolicitudes(datos: DatosReporteExcel): Promise<Blob> {
  const mod = await import("exceljs")
  const WorkbookCtor =
    (mod as { Workbook?: unknown }).Workbook ??
    (mod as { default?: { Workbook?: unknown } }).default?.Workbook
  if (typeof WorkbookCtor !== "function") {
    throw new Error("No se pudo cargar la librería de Excel")
  }
  const Workbook = WorkbookCtor as typeof import("exceljs").Workbook

  const wb = new Workbook()
  wb.creator = datos.emitidoPor
  wb.created = new Date()
  wb.modified = new Date()

  const ws = wb.addWorksheet("Reporte de Solicitudes", {
    properties: { tabColor: { argb: VERDE } },
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: `${FILA_ENC}:${FILA_ENC}`,
      horizontalCentered: true,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    headerFooter: {
      oddFooter:
        '&L&"Calibri"&8Municipalidad de Panajachel&C&"Calibri"&8&A&R&"Calibri"&8Página &P de &N',
    },
    views: [{ state: "frozen", ySplit: FILA_ENC, showGridLines: false }],
  })
  ws.columns = COLUMNAS

  const fusionar = (fila: number, desde: number, hasta: number) => {
    ws.mergeCells(`${LETRAS[desde - 1]}${fila}:${LETRAS[hasta - 1]}${fila}`)
  }
  const rellenar = (fila: number, desde: number, hasta: number, argb: string) => {
    for (let c = desde; c <= hasta; c++) {
      ws.getRow(fila).getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb },
      }
    }
  }
  const bordesEn = (
    fila: number,
    desde: number,
    hasta: number,
    bordes: { top?: Border; bottom?: Border; left?: Border; right?: Border },
  ) => {
    for (let c = desde; c <= hasta; c++) {
      ws.getRow(fila).getCell(c).border = bordes
    }
  }

  const hoy = new Date().toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  // ─── Cintillo institucional (filas 1-2) ────────────────────────────────────
  rellenar(1, 3, 9, VERDE)
  rellenar(2, 3, 9, VERDE)
  fusionar(1, 3, 9)
  fusionar(2, 3, 9)
  ws.getRow(1).height = 30
  ws.getRow(2).height = 18

  const titulo = ws.getCell("C1")
  titulo.value = "MUNICIPALIDAD DE PANAJACHEL"
  titulo.font = { name: "Calibri", size: 18, bold: true, color: { argb: BLANCO } }
  titulo.alignment = { horizontal: "center", vertical: "middle" }

  const subtitulo = ws.getCell("C2")
  subtitulo.value = "Sistema de Gestión de Gastos Empresariales — Reporte de Solicitudes"
  subtitulo.font = { name: "Calibri", size: 10, color: { argb: "FFD9EFE0" } }
  subtitulo.alignment = { horizontal: "center", vertical: "middle" }

  // Badge blanco del escudo
  ws.mergeCells("A1:B2")
  rellenar(1, 1, 2, BLANCO)
  rellenar(2, 1, 2, BLANCO)
  bordesEn(1, 1, 2, {
    top: { style: "medium", color: { argb: VERDE_BORDE } },
    bottom: { style: "thin", color: { argb: VERDE_BORDE } },
    left: { style: "medium", color: { argb: VERDE_BORDE } },
    right: { style: "thin", color: { argb: VERDE_BORDE } },
  })
  bordesEn(2, 1, 2, {
    top: { style: "thin", color: { argb: VERDE_BORDE } },
    bottom: { style: "medium", color: { argb: VERDE_BORDE } },
    left: { style: "medium", color: { argb: VERDE_BORDE } },
    right: { style: "thin", color: { argb: VERDE_BORDE } },
  })

  const logoB64 = await obtenerLogoBase64()
  if (logoB64) {
    try {
      const imgId = wb.addImage({ base64: logoB64, extension: "png" })
      ws.addImage(imgId, {
        tl: { col: 1.05, row: 0.05 },
        ext: { width: 62, height: 61 },
      })
    } catch {
      // sin logo: el reporte se genera igual
    }
  }

  // ─── Banda de acento (fila 3) ──────────────────────────────────────────────
  rellenar(3, 1, 9, VERDE_CLARO)
  ws.getRow(3).height = 5

  // ─── Metadatos en tarjetas (fila 4) ────────────────────────────────────────
  const meta = [
    { desde: 1, hasta: 3, texto: `Fecha de emisión: ${hoy}` },
    { desde: 4, hasta: 6, texto: `Emitido por: ${datos.emitidoPor}` },
    { desde: 7, hasta: 9, texto: `Filtro: ${datos.depFilter}` },
  ]
  meta.forEach((m) => {
    fusionar(4, m.desde, m.hasta)
    for (let c = m.desde; c <= m.hasta; c++) {
      const cell = ws.getRow(4).getCell(c)
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILA_ALTERNA } }
      cell.border = CELDA_BORDE
    }
    const celda = ws.getRow(4).getCell(m.desde)
    celda.value = m.texto
    celda.font = { name: "Calibri", size: 9, color: { argb: TEXTO } }
    celda.alignment = { horizontal: "center", vertical: "middle" }
  })
  ws.getRow(4).height = 20

  // ─── Tarjetas de KPIs (filas 5-6) ──────────────────────────────────────────
  const tarjetas = [
    { desde: 1, hasta: 2, valor: String(datos.kpis.total), etiqueta: "TOTAL SOLICITUDES" },
    { desde: 3, hasta: 4, valor: String(datos.kpis.pendientes), etiqueta: "PENDIENTES" },
    { desde: 5, hasta: 6, valor: String(datos.kpis.rechazadas), etiqueta: "RECHAZADAS" },
    {
      desde: 7,
      hasta: 9,
      valor: datos.kpis.promedioDias.toFixed(1),
      etiqueta: "PROM. DÍAS PENDIENTES",
    },
  ]
  tarjetas.forEach((t) => {
    fusionar(5, t.desde, t.hasta)
    fusionar(6, t.desde, t.hasta)
    bordesEn(5, t.desde, t.hasta, BORDE_MEDIO)
    bordesEn(6, t.desde, t.hasta, BORDE_MEDIO)
    const valor = ws.getRow(5).getCell(t.desde)
    valor.value = t.valor
    valor.font = { name: "Calibri", size: 15, bold: true, color: { argb: VERDE } }
    valor.alignment = { horizontal: "center", vertical: "middle" }
    const etiqueta = ws.getRow(6).getCell(t.desde)
    etiqueta.value = t.etiqueta
    etiqueta.font = { name: "Calibri", size: 8, bold: true, color: { argb: GRIS } }
    etiqueta.alignment = { horizontal: "center", vertical: "middle" }
  })
  ws.getRow(5).height = 26
  ws.getRow(6).height = 14
  ws.getRow(7).height = 6

  // ─── Encabezado de tabla (fila 8) ──────────────────────────────────────────
  const enc = ws.getRow(FILA_ENC)
  ENCABEZADOS.forEach((texto, i) => {
    const celda = enc.getCell(i + 1)
    celda.value = texto
    celda.font = { name: "Calibri", size: 10, bold: true, color: { argb: BLANCO } }
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE } }
    celda.border = {
      top: { style: "thin", color: { argb: BLANCO } },
      bottom: { style: "thin", color: { argb: BLANCO } },
      left: { style: "thin", color: { argb: BLANCO } },
      right: { style: "thin", color: { argb: BLANCO } },
    }
    celda.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
  })
  enc.height = 26
  ws.autoFilter = `A${FILA_ENC}:I${FILA_ENC}`

  // ─── Filas de datos con colores por estado y prioridad ─────────────────────
  datos.rows.forEach((fila, i) => {
    const r = ws.addRow({
      n: i + 1,
      codigo: fila.id,
      dependencia: fila.dep,
      item: fila.item,
      cant: fila.cant,
      prioridad: fila.prioridad,
      estado: fila.estado,
      fecha: fila.fecha,
      solicitante: fila.solicitante,
    })
    r.height = 18
    r.eachCell((celda, col) => {
      celda.border = CELDA_BORDE
      celda.font = { name: "Calibri", size: 10, color: { argb: TEXTO } }
      celda.alignment = {
        vertical: "middle",
        horizontal: col === 3 || col === 4 || col === 9 ? "left" : "center",
        wrapText: col === 4,
      }
      if (i % 2 === 1) {
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FILA_ALTERNA } }
      }
    })
    r.getCell(2).font = { name: "Calibri", size: 10, bold: true, color: { argb: VERDE } }

    const prio = PRIORIDAD_COLOR[fila.prioridad] ?? COLOR_NEUTRO
    const prioCell = r.getCell(6)
    prioCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: prio.bg } }
    prioCell.font = { name: "Calibri", size: 9, bold: true, color: { argb: prio.fg } }
    prioCell.alignment = { horizontal: "center", vertical: "middle" }

    const est = ESTADO_COLOR[fila.estado] ?? COLOR_NEUTRO
    const estCell = r.getCell(7)
    estCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: est.bg } }
    estCell.font = { name: "Calibri", size: 9, bold: true, color: { argb: est.fg } }
    estCell.alignment = { horizontal: "center", vertical: "middle" }
  })

  // ─── Fila total ────────────────────────────────────────────────────────────
  const filaTotal = FILA_DATOS + datos.rows.length
  rellenar(filaTotal, 1, 9, VERDE)
  fusionar(filaTotal, 1, 8)
  const totalIzq = ws.getCell(`A${filaTotal}`)
  totalIzq.value = "TOTAL DE SOLICITUDES EN EL REPORTE"
  totalIzq.font = { name: "Calibri", size: 11, bold: true, color: { argb: BLANCO } }
  totalIzq.alignment = { horizontal: "right", vertical: "middle" }
  const totalDer = ws.getCell(`I${filaTotal}`)
  totalDer.value = datos.rows.length
  totalDer.font = { name: "Calibri", size: 11, bold: true, color: { argb: BLANCO } }
  totalDer.alignment = { horizontal: "center", vertical: "middle" }
  ws.getRow(filaTotal).height = 22

  // ─── Firmas ────────────────────────────────────────────────────────────────
  const filaEtiquetas = filaTotal + 3
  for (const col of [2, 3, 4, 6, 7, 8]) {
    ws.getRow(filaEtiquetas).getCell(col).border = {
      top: { style: "thin", color: { argb: GRIS_CLARO } },
    }
  }
  ws.mergeCells(`B${filaEtiquetas}:D${filaEtiquetas}`)
  ws.mergeCells(`F${filaEtiquetas}:H${filaEtiquetas}`)
  const elaborado = ws.getCell(`B${filaEtiquetas}`)
  elaborado.value = "Elaborado por"
  elaborado.font = { name: "Calibri", size: 9, bold: true, color: { argb: GRIS } }
  elaborado.alignment = { horizontal: "center", vertical: "bottom" }
  const voBo = ws.getCell(`F${filaEtiquetas}`)
  voBo.value = "Vo. Bo. Dirección de Administración y Finanzas"
  voBo.font = { name: "Calibri", size: 9, bold: true, color: { argb: GRIS } }
  voBo.alignment = { horizontal: "center", vertical: "bottom" }

  const filaFirmas = filaEtiquetas + 1
  ws.mergeCells(`B${filaFirmas}:D${filaFirmas}`)
  ws.mergeCells(`F${filaFirmas}:H${filaFirmas}`)
  const nombreElaborado = ws.getCell(`B${filaFirmas}`)
  nombreElaborado.value = datos.emitidoPor
  nombreElaborado.font = { name: "Calibri", size: 9, color: { argb: TEXTO } }
  nombreElaborado.alignment = { horizontal: "center", vertical: "top" }
  const nombreVoBo = ws.getCell(`F${filaFirmas}`)
  nombreVoBo.value = "Municipalidad de Panajachel"
  nombreVoBo.font = { name: "Calibri", size: 9, color: { argb: TEXTO } }
  nombreVoBo.alignment = { horizontal: "center", vertical: "top" }
  ws.getRow(filaFirmas).height = 16

  // ─── Pie institucional ─────────────────────────────────────────────────────
  const filaPie = filaFirmas + 3
  fusionar(filaPie, 1, 9)
  const pie = ws.getCell(`A${filaPie}`)
  pie.value =
    "Documento generado por el Sistema de Gestión de Gastos Empresariales · Municipalidad de Panajachel"
  pie.font = { name: "Calibri", size: 8, italic: true, color: { argb: GRIS_CLARO } }
  pie.alignment = { horizontal: "center", vertical: "middle" }

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}
