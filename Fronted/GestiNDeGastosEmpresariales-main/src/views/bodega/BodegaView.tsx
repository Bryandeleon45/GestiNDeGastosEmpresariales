import { useState } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { useBodegaController, ESTADOS_SOLICITUD_FILTRO } from "@/controllers/useBodegaController"
import {
  autorizarValeSalida,
  entregarValeSalida,
  cancelarValeSalida,
  type Recepcion,
  type ValeSalida,
} from "@/api/bodega"
import { cambiarEstadoRequisicion, obtenerRequisicion, type Requisicion } from "@/api/requisiciones"
import { PRIORIDAD_STYLE, ESTADO_SOL_STYLE } from "@/models/solicitudes"
import { ApiError } from "@/api/client"
import NuevaRecepcionModal from "@/views/bodega/NuevaRecepcionModal"
import VerificarRecepcionModal from "@/views/bodega/VerificarRecepcionModal"
import NuevoValeModal from "@/views/bodega/NuevoValeModal"

const ESTADO_REC_STYLE: Record<string, { bg: string; color: string }> = {
  "En Proceso": { bg: "#DCFCE7", color: "#16A34A" },
  Completa: { bg: "#DCFCE7", color: "#16A34A" },
  Parcial: { bg: "#FEF9C3", color: "#854D0E" },
  "Con Novedades": { bg: "#FEE2E2", color: "#DC2626" },
  Cancelada: { bg: "#F1F5F9", color: "#64748B" },
}

const ESTADO_VALE_STYLE: Record<string, { bg: string; color: string }> = {
  Pendiente: { bg: "#F1F5F9", color: "#64748B" },
  Autorizado: { bg: "#FEF9C3", color: "#854D0E" },
  Entregado: { bg: "#DCFCE7", color: "#16A34A" },
  Cancelado: { bg: "#FEE2E2", color: "#DC2626" },
}

const ALERTA_STYLE: Record<string, { bg: string; color: string }> = {
  Crítico: { bg: "#FEE2E2", color: "#DC2626" },
  Bajo: { bg: "#FEF9C3", color: "#854D0E" },
  OK: { bg: "#DCFCE7", color: "#16A34A" },
}

const TIPO_KARDEX_STYLE: Record<string, string> = {
  Entrada: "bg-green-50 text-green-700 border border-green-200",
  Salida: "bg-red-50 text-red-600 border border-red-200",
  Ajuste: "bg-amber-50 text-amber-700 border border-amber-200",
}

function fmtFecha(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function BodegaView({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const {
    tab,
    setTab,
    inventario,
    alertas,
    recepciones,
    kardex,
    resumen,
    vales,
    solicitudes,
    solEstado,
    setSolEstado,
    loadingInventario,
    loadingRecepciones,
    loadingSolicitudes,
    reload,
  } = useBodegaController(onToast)

  const [showNuevaRec, setShowNuevaRec] = useState(false)
  const [showNuevoVale, setShowNuevoVale] = useState(false)
  const [verifRecepcion, setVerifRecepcion] = useState<Recepcion | null>(null)
  const [rechazoRow, setRechazoRow] = useState<Requisicion | null>(null)
  const [motivo, setMotivo] = useState("")
  const [workingSol, setWorkingSol] = useState(false)
  const [detalleSol, setDetalleSol] = useState<Requisicion | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [pdfPreview, setPdfPreview] = useState<number | null>(null)

  const abrirDetalle = async (r: Requisicion) => {
    setDetalleSol(r)
    setLoadingDetalle(true)
    try {
      const d = await obtenerRequisicion(r.id_requisicion)
      setDetalleSol(d)
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo cargar el detalle")
    } finally {
      setLoadingDetalle(false)
    }
  }

  const cerrarDetalle = () => {
    setDetalleSol(null)
    setRechazoRow(null)
    setMotivo("")
    setPdfPreview(null)
  }

  const aprobarSolicitud = async (r: Requisicion) => {
    if (!window.confirm(`¿Aprobar la solicitud ${r.codigo_requisicion}?`)) return
    setWorkingSol(true)
    try {
      await cambiarEstadoRequisicion(r.id_requisicion, { estado: "Aprobada" })
      onToast("Solicitud aprobada", `${r.codigo_requisicion} fue marcada como Aprobada.`)
      setDetalleSol(null)
      reload()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo aprobar la solicitud")
    } finally {
      setWorkingSol(false)
    }
  }

  const confirmarRechazoSolicitud = async () => {
    if (!rechazoRow || !motivo.trim()) return
    setWorkingSol(true)
    try {
      await cambiarEstadoRequisicion(rechazoRow.id_requisicion, {
        estado: "Rechazada",
        notas_aprobacion: motivo.trim(),
      })
      onToast("Solicitud rechazada", `${rechazoRow.codigo_requisicion} fue marcada como Rechazada.`)
      setRechazoRow(null)
      setMotivo("")
      setDetalleSol(null)
      reload()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo rechazar la solicitud")
    } finally {
      setWorkingSol(false)
    }
  }

  const autorizar = async (v: ValeSalida) => {
    if (!window.confirm(`¿Autorizar el vale para ${v.nombre_dependencia}?`)) return
    try {
      await autorizarValeSalida(v.id_vale_salida)
      onToast("Vale autorizado", "El vale quedó listo para entrega.")
      reload()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo autorizar el vale")
    }
  }

  const entregar = async (v: ValeSalida) => {
    if (!window.confirm(`¿Entregar el vale y rebajar el stock de ${v.nombre_dependencia}?`)) return
    try {
      await entregarValeSalida(v.id_vale_salida)
      onToast("Vale entregado", "Stock actualizado y Kardex registrado.")
      reload()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo entregar el vale")
    }
  }

  const cancelar = async (v: ValeSalida) => {
    if (!window.confirm(`¿Cancelar el vale para ${v.nombre_dependencia}?`)) return
    try {
      await cancelarValeSalida(v.id_vale_salida)
      onToast("Vale cancelado", "El vale fue cancelado.")
      reload()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo cancelar el vale")
    }
  }

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                Bodega y Recepción
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Control de ingresos de mercancía e inventario de insumos.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowNuevoVale(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl shadow-sm transition-all hover:opacity-90 shrink-0"
                style={{ backgroundColor: G }}
              >
                <Icons.Doc /> Nuevo Vale
              </button>
              <button
                onClick={() => setShowNuevaRec(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl border-2 transition-all hover:bg-green-50 shrink-0"
                style={{ color: G, borderColor: G }}
              >
                <Icons.Plus /> Nueva Recepción
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-extrabold text-gray-900">Alertas de Stock</p>
                <Icons.Warning />
              </div>
              <div className="space-y-2.5">
                {alertas.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">Sin alertas de stock.</p>
                )}
                {alertas.slice(0, 5).map((a) => (
                  <div key={a.id_insumo} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-none">{a.nombre}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.codigo_insumo} · Stock {a.stock_actual} / Mín {a.stock_minimo}
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: ALERTA_STYLE[a.alerta].bg, color: ALERTA_STYLE[a.alerta].color }}
                    >
                      {a.alerta}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setTab("inventario")}
                className="mt-4 w-full py-2.5 text-sm font-bold rounded-xl border-2 transition-all hover:bg-green-50 active:scale-95"
                style={{ color: G, borderColor: G }}
              >
                Ver Inventario Completo
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-base font-extrabold text-gray-900 mb-4">Resumen</p>
              <div className="grid grid-cols-3 divide-x divide-gray-100 mt-2">
                {[
                  { label: "Recepciones", value: resumen?.recepciones ?? 0, color: G },
                  { label: "En Proceso", value: resumen?.en_proceso ?? 0, color: "#D97706" },
                  { label: "Alertas Stock", value: resumen?.alertas_stock ?? 0, color: "#DC2626" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center px-3 py-3 text-center">
                    <p className="text-4xl font-extrabold font-mono leading-none" style={{ color: s.color }}>
                      {s.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 leading-snug">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(["solicitudes", "recepciones", "inventario", "kardex", "vales"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-2 text-sm font-bold rounded-xl transition-all"
                style={tab === t ? { backgroundColor: G, color: "white" } : { color: "#6B7280", border: "1px solid #E5E7EB", backgroundColor: "white" }}
              >
                {t === "solicitudes" ? "Solicitudes" : t === "recepciones" ? "Recepciones" : t === "inventario" ? "Inventario" : t === "kardex" ? "Kardex" : "Vales de Salida"}
              </button>
            ))}
          </div>

          {tab === "solicitudes" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
                <h2 className="text-base font-bold" style={{ color: G }}>Revisión y Aprobación de Solicitudes</h2>
                <div className="relative">
                  <select
                    value={solEstado}
                    onChange={(e) => setSolEstado(e.target.value)}
                    className="appearance-none pl-4 pr-9 py-2 text-sm font-semibold bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-600 cursor-pointer"
                  >
                    {ESTADOS_SOLICITUD_FILTRO.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Icons.ChevDown />
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["CÓDIGO", "DEPENDENCIA", "ÍTEM", "PRIORIDAD", "ESTADO", "FECHA", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSolicitudes ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Cargando solicitudes…</td></tr>
                    ) : solicitudes.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Sin solicitudes en este estado.</td></tr>
                    ) : (
                      solicitudes.map((r) => (
                        <tr
                          key={r.id_requisicion}
                          onClick={() => abrirDetalle(r)}
                          className="border-b border-gray-50 last:border-0 hover:bg-green-50/40 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-4"><p className="text-xs font-bold font-mono text-gray-700">{r.codigo_requisicion}</p></td>
                          <td className="px-4 py-4"><p className="text-sm font-medium text-gray-800">{r.nombre_dependencia}</p></td>
                          <td className="px-4 py-4 max-w-[200px]"><p className="text-sm text-gray-700 leading-snug line-clamp-2">{r.item_nombre ?? r.items?.[0]?.insumo_nombre ?? r.items?.[0]?.descripcion_libre ?? "Sin ítems"}</p></td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${PRIORIDAD_STYLE[r.prioridad]}`}>
                              {r.prioridad}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${ESTADO_SOL_STYLE[r.estado]}`}>
                              {r.estado}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap"><p className="text-sm text-gray-600 font-mono">{new Date(r.fecha_solicitud).toLocaleDateString("es-GT")}</p></td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: G }}>
                              <Icons.Eye /> Ver
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "recepciones" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold" style={{ color: G }}>Historial de Recepciones</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["COMPROBANTE", "ORDEN", "PROVEEDOR", "FECHA", "ESTADO", "ACCIONES"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRecepciones ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">Cargando recepciones…</td></tr>
                    ) : recepciones.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">Sin recepciones registradas.</td></tr>
                    ) : (
                      recepciones.map((r) => {
                        const est = ESTADO_REC_STYLE[r.estado] ?? { bg: "#F1F5F9", color: "#64748B" }
                        return (
                          <tr key={r.id_recepcion} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-4"><p className="text-xs font-bold font-mono text-gray-700">{r.numero_comprobante}</p></td>
                            <td className="px-4 py-4"><p className="text-xs font-mono text-gray-600">{r.numero_orden}</p></td>
                            <td className="px-4 py-4"><p className="text-sm font-medium text-gray-800">{r.razon_social}</p></td>
                            <td className="px-4 py-4 whitespace-nowrap"><p className="text-sm text-gray-600 font-mono">{fmtFecha(r.fecha_recepcion)}</p></td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap" style={{ backgroundColor: est.bg, color: est.color }}>
                                {r.estado}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {r.estado === "En Proceso" ? (
                                <button onClick={() => setVerifRecepcion(r)} className="text-sm font-bold transition-colors hover:opacity-70" style={{ color: G }}>
                                  Verificar
                                </button>
                              ) : (
                                <button onClick={() => onToast("Recepción", `Comprobante ${r.numero_comprobante} (${r.estado}).`)} className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                                  Ver
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "inventario" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold" style={{ color: G }}>Inventario de Insumos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["CÓDIGO", "INSUMO", "CATEGORÍA", "STOCK", "MÍNIMO", "ESTADO"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingInventario ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">Cargando inventario…</td></tr>
                    ) : inventario.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">Sin insumos en inventario.</td></tr>
                    ) : (
                      inventario.map((inv) => {
                        const al = ALERTA_STYLE[inv.alerta] ?? ALERTA_STYLE.OK
                        return (
                          <tr key={inv.id_insumo} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-4"><p className="text-xs font-mono font-bold text-gray-700">{inv.codigo_insumo}</p></td>
                            <td className="px-4 py-4"><p className="text-sm font-medium text-gray-800">{inv.nombre}</p></td>
                            <td className="px-4 py-4"><p className="text-sm text-gray-600">{inv.categoria}</p></td>
                            <td className="px-4 py-4"><p className="text-sm font-bold font-mono text-gray-900">{inv.stock_actual} {inv.unidad_simbolo}</p></td>
                            <td className="px-4 py-4"><p className="text-sm text-gray-600">{inv.stock_minimo}</p></td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap" style={{ backgroundColor: al.bg, color: al.color }}>
                                {inv.alerta}
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
          )}

          {tab === "kardex" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold" style={{ color: G }}>Kardex de Movimientos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["FECHA", "INSUMO", "TIPO", "CANT.", "ANTERIOR", "ACTUAL", "USUARIO"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kardex.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Sin movimientos de kardex.</td></tr>
                    ) : (
                      kardex.map((k) => (
                        <tr key={k.id_kardex} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap"><p className="text-sm text-gray-600 font-mono">{fmtFecha(k.fecha_movimiento)}</p></td>
                          <td className="px-4 py-4"><p className="text-sm font-medium text-gray-800">{k.insumo_nombre}</p></td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${TIPO_KARDEX_STYLE[k.tipo_movimiento]}`}>
                              {k.tipo_movimiento}
                            </span>
                          </td>
                          <td className="px-4 py-4"><p className="text-sm font-bold font-mono text-gray-900">{k.cantidad}</p></td>
                          <td className="px-4 py-4"><p className="text-sm text-gray-600">{k.stock_anterior}</p></td>
                          <td className="px-4 py-4"><p className="text-sm font-bold text-gray-900">{k.stock_actual}</p></td>
                          <td className="px-4 py-4"><p className="text-sm text-gray-600">{k.nombre_usuario}</p></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "vales" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold" style={{ color: G }}>Vales de Salida</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["DEPENDENCIA", "SOLICITANTE", "JUSTIFICACIÓN", "FECHA", "ESTADO", "ACCIONES"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vales.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">Sin vales de salida registrados.</td></tr>
                    ) : (
                      vales.map((v) => {
                        const est = ESTADO_VALE_STYLE[v.estado] ?? { bg: "#F1F5F9", color: "#64748B" }
                        return (
                          <tr key={v.id_vale_salida} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-4"><p className="text-sm font-medium text-gray-800">{v.nombre_dependencia}</p></td>
                            <td className="px-4 py-4"><p className="text-sm text-gray-600">{v.nombre_usuario}</p></td>
                            <td className="px-4 py-4"><p className="text-xs text-gray-500 max-w-[220px] truncate">{v.justificacion || "—"}</p></td>
                            <td className="px-4 py-4 whitespace-nowrap"><p className="text-sm text-gray-600 font-mono">{fmtFecha(v.fecha_salida)}</p></td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap" style={{ backgroundColor: est.bg, color: est.color }}>
                                {v.estado}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {v.estado === "Pendiente" && (
                                  <>
                                    <button onClick={() => autorizar(v)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg text-white transition-colors hover:opacity-80" style={{ backgroundColor: G }}>
                                      <Icons.ShieldCheck /> Autorizar
                                    </button>
                                    <button onClick={() => cancelar(v)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg text-red-600 border border-red-200 transition-colors hover:bg-red-50">
                                      <Icons.X /> Cancelar
                                    </button>
                                  </>
                                )}
                                {v.estado === "Autorizado" && (
                                  <button onClick={() => entregar(v)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg text-white transition-colors hover:opacity-80" style={{ backgroundColor: G }}>
                                    <Icons.Send /> Entregar
                                  </button>
                                )}
                                {(v.estado === "Entregado" || v.estado === "Cancelado") && (
                                  <span className="text-xs font-semibold text-gray-400">—</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNuevaRec && (
        <NuevaRecepcionModal
          onClose={() => setShowNuevaRec(false)}
          onSuccess={(recepcion) => {
            setShowNuevaRec(false)
            reload()
            setVerifRecepcion(recepcion)
          }}
          onToast={onToast}
        />
      )}
      {showNuevoVale && (
        <NuevoValeModal
          onClose={() => setShowNuevoVale(false)}
          onSuccess={() => {
            setShowNuevoVale(false)
            setTab("vales")
            reload()
          }}
          onToast={onToast}
        />
      )}
      {verifRecepcion && (
        <VerificarRecepcionModal
          recepcion={verifRecepcion}
          onClose={() => setVerifRecepcion(null)}
          onChanged={() => {
            setVerifRecepcion(null)
            reload()
          }}
          onToast={onToast}
        />
      )}
      {rechazoRow && (
        <div
          onClick={(e) => e.target === e.currentTarget && setRechazoRow(null)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900">
              Motivo de rechazo · {rechazoRow.codigo_requisicion}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              El motivo es obligatorio y quedará registrado en la bitácora.
            </p>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Escriba el motivo del rechazo…"
              className="w-full mt-3 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none focus:border-green-600"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRechazoRow(null)
                  setMotivo("")
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={!motivo.trim() || workingSol}
                onClick={confirmarRechazoSolicitud}
                className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#DC2626" }}
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {detalleSol && (
        <div className="fixed inset-0 z-[150] flex">
          <div
            onClick={cerrarDetalle}
            className="drawer-backdrop absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(1.5px)" }}
          />
          <aside
            className="drawer-right relative ml-auto h-full w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900">
                    {detalleSol.codigo_requisicion}
                  </h2>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${PRIORIDAD_STYLE[detalleSol.prioridad]}`}>
                    {detalleSol.prioridad}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ESTADO_SOL_STYLE[detalleSol.estado]}`}>
                    {detalleSol.estado}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {detalleSol.nombre_dependencia} ·{" "}
                  {new Date(detalleSol.fecha_solicitud).toLocaleDateString("es-GT")}
                </p>
              </div>
              <button
                onClick={cerrarDetalle}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all shrink-0 mt-0.5"
              >
                <Icons.X />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {loadingDetalle ? (
                <p className="text-sm text-gray-400 text-center py-10">Cargando detalle…</p>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Ítems Solicitados
                    </p>
                    <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
                      {(detalleSol.items ?? []).map((it) => (
                        <div key={it.id_detalle} className="px-4 py-3">
                          <p className="text-sm font-bold text-gray-900 leading-snug">
                            {it.insumo_nombre ?? it.descripcion_libre}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {Number(it.cantidad).toLocaleString("es-GT")} {it.unidad_nombre}
                            {it.observaciones ? ` · ${it.observaciones}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Justificación
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {detalleSol.justificacion}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Solicitante
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {detalleSol.nombre ? `${detalleSol.nombre} ${detalleSol.apellido ?? ""}`.trim() : detalleSol.nombre_usuario}
                    </p>
                    {detalleSol.lugar_entrega && (
                      <p className="text-xs text-gray-500 mt-1">Entrega: {detalleSol.lugar_entrega}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Documentos Adjuntos ({detalleSol.imagenes?.length ?? 0})
                    </p>
                    {(detalleSol.imagenes ?? []).length === 0 ? (
                      <p className="text-xs text-gray-400">Sin documentos adjuntos.</p>
                    ) : (
                      <div className="space-y-2">
                        {detalleSol.imagenes!.map((img) => {
                          const abierto = pdfPreview === img.id_imagen
                          return (
                            <div key={img.id_imagen} className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setPdfPreview(abierto ? null : img.id_imagen)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 transition-colors"
                              >
                                <span className="text-gray-500 shrink-0">
                                  <Icons.PDF />
                                </span>
                                <span className="flex-1 min-w-0 text-left text-sm font-medium text-gray-800 truncate">
                                  {img.nombre_archivo}
                                </span>
                                <span className="text-xs font-bold shrink-0" style={{ color: G }}>
                                  {abierto ? "Cerrar" : "Ver"}
                                </span>
                              </button>
                              {abierto && (
                                <iframe
                                  src={img.contenido_base64}
                                  title={img.nombre_archivo}
                                  className="w-full h-80 border-t border-gray-200 bg-white"
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 shrink-0 flex-wrap">
              <button
                onClick={cerrarDetalle}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cerrar
              </button>
              <div className="flex-1" />
              {detalleSol.estado === "En Revisión" && (
                <>
                  <button
                    disabled={workingSol}
                    onClick={() => aprobarSolicitud(detalleSol)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
                    style={{ backgroundColor: "#16A34A" }}
                  >
                    <Icons.CheckMark /> Aprobar
                  </button>
                  <button
                    disabled={workingSol}
                    onClick={() => setRechazoRow(detalleSol)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 border border-red-200 rounded-xl transition-all hover:bg-red-50 disabled:opacity-50"
                  >
                    <Icons.X /> Rechazar
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
