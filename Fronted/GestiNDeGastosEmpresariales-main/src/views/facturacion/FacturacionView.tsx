import { useMemo, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { useFacturacionController } from "@/controllers/useFacturacionController"
import { type Factura, type CronogramaItem } from "@/api/facturacion"
import NuevaOrdenModal from "@/views/facturacion/NuevaOrdenModal"
import FacturaDrawer from "@/views/facturacion/FacturaDrawer"
import PdfViewerModal from "@/views/common/PdfViewerModal"
import { generarReporteFacturacionPdf } from "@/lib/facturasPdf"
import { fmtFecha, hoyISO } from "@/utils/fechas"

const ESTADO_STYLE: Record<string, { bg: string; color: string }> = {
  Pagado: { bg: "#DCFCE7", color: "#16A34A" },
  "Pagado con atraso": { bg: "#FDE68A", color: "#92400E" },
  Pendiente: { bg: "#FEF9C3", color: "#854D0E" },
  Vencido: { bg: "#FEE2E2", color: "#DC2626" },
  Rechazada: { bg: "var(--gray-100)", color: "#64748B" },
}

const fmt = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

const parseFecha = (s?: string | null): Date | null => {
  if (!s) return null
  const [y, m, d] = s.slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

const ESTADO_CRONOGRAMA: Record<string, string> = {
  Recibida: "Recibida",
  "En Revisión": "En revisión",
  Aprobada: "Aprobada",
  Pendiente: "Pendiente",
  Programada: "Pago programado",
}

const keyFecha = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const construirMes = (mes: Date): Array<{ fecha: Date; enMes: boolean }> => {
  const primero = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const offset = (primero.getDay() + 6) % 7 // la semana inicia en lunes
  const inicio = new Date(primero.getFullYear(), mes.getMonth(), 1 - offset)
  return Array.from({ length: 42 }, (_, i) => {
    const fecha = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i)
    return {
      fecha,
      enMes: fecha.getMonth() === mes.getMonth() && fecha.getFullYear() === mes.getFullYear(),
    }
  })
}

// Mapa fecha → true si ese día tiene un compromiso ya vencido (rojo).
const marcasDeDias = (items: CronogramaItem[]): Map<string, boolean> => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const mapa = new Map<string, boolean>()
  for (const c of items) {
    const f = parseFecha(c.fecha_pago_programada) ?? parseFecha(c.fecha_vencimiento)
    if (!f) continue
    const k = keyFecha(f)
    mapa.set(k, (mapa.get(k) ?? false) || f < hoy)
  }
  return mapa
}

export default function FacturacionView({
  onToast,
  onNav,
}: {
  onToast: (m: string, s: string) => void
  onNav: (k: string) => void
}) {
  const {
    facturas,
    loading,
    resumen,
    cronograma,
    estadoFilter,
    setEstadoFilter,
    showEstadoDD,
    setShowEstadoDD,
    showNuevaOrden,
    setShowNuevaOrden,
    selectedFactura,
    setSelectedFactura,
    estadoDDRef,
    reload,
  } = useFacturacionController(onToast)

  const [exportando, setExportando] = useState(false)
  const [pdfSrc, setPdfSrc] = useState<string | null>(null)
  const [pdfNombre, setPdfNombre] = useState("")
  const [mesVisible, setMesVisible] = useState(() => {
    const h = new Date()
    return new Date(h.getFullYear(), h.getMonth(), 1)
  })

  const marcas = useMemo(() => marcasDeDias(cronograma), [cronograma])
  const celdas = useMemo(() => construirMes(mesVisible), [mesVisible])

  const exportarReporte = async () => {
    if (exportando) return
    setExportando(true)
    try {
      const blob = await generarReporteFacturacionPdf({
        facturas,
        resumen,
        cronograma,
        filtroEstado: estadoFilter,
      })
      const fecha = hoyISO()
      const nombre = `Reporte_Facturacion_Panajachel_${fecha}.pdf`
      if (pdfSrc) URL.revokeObjectURL(pdfSrc)
      setPdfSrc(URL.createObjectURL(blob))
      setPdfNombre(nombre)
      onToast("Reporte generado", "El PDF está listo para previsualizar o descargar.")
    } catch (e) {
      onToast("Error al exportar", e instanceof Error ? e.message : "No se pudo generar el PDF del reporte.")
    } finally {
      setExportando(false)
    }
  }

  const cerrarVisorPdf = () => {
    if (pdfSrc) URL.revokeObjectURL(pdfSrc)
    setPdfSrc(null)
  }

  const hoyDate = new Date()
  const hoyKey = keyFecha(hoyDate)
  const esMesActual =
    mesVisible.getMonth() === hoyDate.getMonth() &&
    mesVisible.getFullYear() === hoyDate.getFullYear()
  const labelMes = `${mesVisible.toLocaleDateString("es-GT", { month: "long" })} ${mesVisible.getFullYear()}`
  const navegarMes = (delta: number) =>
    setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  const irAHoy = () => setMesVisible(new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1))

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "var(--gray-50)" }}>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                Facturación y Órdenes de Pago
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestión administrativa de compromisos financieros municipales.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={exportarReporte}
                disabled={exportando}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all hover:bg-gray-50 disabled:opacity-60 disabled:cursor-wait"
                style={{ color: G, borderColor: G }}
              >
                <Icons.PDF /> {exportando ? "Generando…" : "Exportar Reporte"}
              </button>
              <button
                onClick={() => setShowNuevaOrden(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90"
                style={{ backgroundColor: G }}
              >
                <Icons.Plus /> Nueva Orden de Pago
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-tight">
                  Total Pagado
                  <br />
                  (Mes)
                </p>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: GL }}
                >
                  <Icons.Facturacion />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900 mt-3 font-mono leading-none">
                {fmt(resumen?.total_por_pagar ?? 0)}
              </p>
              <p className="text-xs font-bold mt-1.5" style={{ color: G }}>
                Pagos ejecutados en el mes
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  Facturas
                  <br />
                  Pendientes
                </p>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: GL }}
                >
                  <Icons.FileText />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-gray-900 mt-3 font-mono">
                {resumen?.facturas_pendientes ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1.5">
                {resumen?.en_revision ?? 0} en revisión técnica
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  Vencimientos
                  <br />
                  Próximos
                </p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-50">
                  <Icons.HistoryClock />
                </div>
              </div>
              <p className="text-4xl font-extrabold font-mono mt-3 text-red-600">
                {String(resumen?.vencimientos_proximos ?? 0).padStart(2, "0")}
              </p>
              <p className="text-xs font-semibold text-red-500 mt-1.5">
                Requiere acción inmediata
              </p>
            </div>

          </div>

          <div className="flex gap-5 items-start flex-wrap xl:flex-nowrap">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 w-full xl:w-64 shrink-0">
              <p className="text-base font-extrabold text-gray-900 mb-3">
                Cronograma de Pagos
              </p>

              <div className="flex items-center justify-between mb-2">
                <button
                  aria-label="Mes anterior"
                  onClick={() => navegarMes(-1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                >
                  ‹
                </button>
                <p className="text-xs font-extrabold text-gray-800 capitalize">{labelMes}</p>
                <button
                  aria-label="Mes siguiente"
                  onClick={() => navegarMes(1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                >
                  ›
                </button>
              </div>

              {!esMesActual && (
                <div className="flex justify-center mb-1.5">
                  <button
                    onClick={irAHoy}
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-md border transition-all hover:bg-gray-50"
                    style={{ color: G, borderColor: "#D1D5DB" }}
                  >
                    Hoy
                  </button>
                </div>
              )}

              <div className="grid grid-cols-7 mb-1">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                  <span
                    key={i}
                    className="text-center text-[9px] font-bold text-gray-400 uppercase"
                  >
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {celdas.map((c, i) => {
                  const k = keyFecha(c.fecha)
                  const marca = marcas.get(k)
                  const esHoy = k === hoyKey
                  return (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span
                        className="w-6 h-6 flex items-center justify-center text-[11px] rounded-full"
                        style={
                          esHoy
                            ? {
                                backgroundColor: "#ECFDF5",
                                border: `2px solid ${G}`,
                                color: G,
                                fontWeight: 800,
                              }
                            : {
                                color: c.enMes ? "#374151" : "#D1D5DB",
                                fontWeight: c.enMes ? 600 : 400,
                              }
                        }
                      >
                        {c.fecha.getDate()}
                      </span>
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{
                          backgroundColor:
                            marca === undefined ? "transparent" : marca ? "#EF4444" : "#16A34A",
                        }}
                      />
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2.5 border-t border-gray-100 mt-3 pt-3">
                {cronograma.length === 0 && (
                  <p className="text-xs text-gray-400 py-6 text-center">
                    Sin facturas pendientes ni pagos programados.
                  </p>
                )}
                {cronograma.slice(0, 8).map((c, i) => {
                  const fechaLim =
                    parseFecha(c.fecha_pago_programada) ?? parseFecha(c.fecha_vencimiento)
                  const hoy = new Date()
                  hoy.setHours(0, 0, 0, 0)
                  const dias = fechaLim
                    ? Math.round((fechaLim.getTime() - hoy.getTime()) / 86400000)
                    : null
                  const danger = dias !== null && dias < 0
                  const fechaTexto = fechaLim
                    ? fmtFecha(fechaLim.toISOString().slice(0, 10))
                    : ""
                  const plazoTexto =
                    dias === null
                      ? ""
                      : dias < 0
                        ? `Venció ${fechaTexto} · hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "día" : "días"}`
                        : dias === 0
                          ? `${fechaTexto} · vence hoy`
                          : `Vence ${fechaTexto} · quedan ${dias} ${dias === 1 ? "día" : "días"}`
                  const label = ESTADO_CRONOGRAMA[c.estado] ?? c.estado
                  return (
                    <div
                      key={`${c.origen}-${c.numero_orden_pago ?? c.numero_factura}-${i}`}
                      className="rounded-lg px-3 py-2.5 border-l-4"
                      style={
                        danger
                          ? { backgroundColor: "#FEF2E2", borderColor: "#F87171" }
                          : { backgroundColor: "#ECFDF5", borderColor: G }
                      }
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <svg
                          className="w-3.5 h-3.5 shrink-0"
                          fill="none"
                          style={{ stroke: danger ? "#EF4444" : G }}
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          {danger ? (
                            <>
                              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </>
                          ) : (
                            <>
                              <rect x="3" y="4" width="18" height="18" rx="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </>
                          )}
                        </svg>
                        <p
                          className="text-[11px] font-extrabold"
                          style={{ color: danger ? "#DC2626" : G }}
                        >
                          {label}
                        </p>
                      </div>
                      <p className="text-[11px] leading-snug" style={{ color: danger ? "#B91C1C" : "#166534" }}>
                        {c.razon_social} · {c.numero_factura}
                      </p>
                      <p className="text-[11px] font-semibold" style={{ color: danger ? "#DC2626" : "#4B5563" }}>
                        {plazoTexto}
                      </p>
                      <p className="text-[11px] font-bold" style={{ color: danger ? "#DC2626" : G }}>
                        {fmt(c.monto)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 flex-wrap">
                <p className="text-base font-extrabold text-gray-900">
                  Historial de Facturas y Pagos
                </p>
                <div className="flex items-center gap-2">
                  <div className="relative" ref={estadoDDRef}>
                    <button
                      onClick={() => setShowEstadoDD((v) => !v)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      {estadoFilter === "Todos" ? "Todos los estados" : estadoFilter}
                      <Icons.ChevDown />
                    </button>
                    {showEstadoDD && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden min-w-[160px]">
                        {(["Todos", "Pagado", "Pagado con atraso", "Pendiente", "Vencido", "Rechazada"] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setEstadoFilter(opt)
                              setShowEstadoDD(false)
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                            style={{
                              color: estadoFilter === opt ? G : "#374151",
                              fontWeight: estadoFilter === opt ? 700 : 400,
                            }}
                          >
                            {opt === "Todos" ? "Todos los estados" : opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px]">
                  <thead>
                    <tr className="border-b border-gray-100" style={{ backgroundColor: "var(--gray-50)" }}>
                      {["NO. FACTURA", "PROVEEDOR", "FECHA EMISIÓN", "MONTO", "ESTADO"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                          Cargando facturas…
                        </td>
                      </tr>
                    ) : facturas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                          Sin facturas registradas.
                        </td>
                      </tr>
                    ) : (
                      facturas.map((f) => {
                        const est = ESTADO_STYLE[f.estado_visible] ?? ESTADO_STYLE.Pendiente
                        return (
                          <tr
                            key={f.id_factura}
                            onClick={() => setSelectedFactura(f)}
                            className="border-b border-gray-50 cursor-pointer transition-colors hover:bg-green-50/40 group"
                          >
                            <td className="px-5 py-4">
                              <p className="text-sm font-extrabold text-gray-900">
                                {f.serie ? `${f.serie}-` : ""}{f.numero_factura}
                              </p>
                              <p className="text-[11px] text-gray-400">{f.numero_orden}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm text-gray-700 leading-snug">{f.razon_social}</p>
                              <p className="text-[11px] text-gray-400">{f.nit}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm text-gray-600">{fmtFecha(f.fecha_emision)}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-extrabold text-gray-900 font-mono">{fmt(f.monto_total)}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className="text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: est.bg, color: est.color }}
                              >
                                {f.estado_visible}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNuevaOrden && (
        <NuevaOrdenModal
          onClose={() => setShowNuevaOrden(false)}
          onSuccess={() => {
            setShowNuevaOrden(false)
            reload()
          }}
          onToast={onToast}
        />
      )}
      {selectedFactura && (
        <FacturaDrawer
          facturaId={selectedFactura.id_factura}
          onClose={() => setSelectedFactura(null)}
          onToast={onToast}
          onChanged={reload}
        />
      )}
      {pdfSrc && (
        <PdfViewerModal
          src={pdfSrc}
          nombre={pdfNombre}
          titulo="Reporte de Facturación"
          onClose={cerrarVisorPdf}
        />
      )}
    </>
  )
}
