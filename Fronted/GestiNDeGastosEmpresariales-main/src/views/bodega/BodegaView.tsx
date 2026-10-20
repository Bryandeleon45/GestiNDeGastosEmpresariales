import { useState, useEffect } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { useBodegaController, ESTADOS_SOLICITUD_FILTRO } from "@/controllers/useBodegaController"
import {
  aprobarOrdenAdjudicada,
  obtenerValeSalida,
  type Recepcion,
  type ValeSalida,
  type ValeSalidaDetalle,
} from "@/api/bodega"
import { cambiarEstadoRequisicion, obtenerRequisicion, asignarProveedorRequisicion, type Requisicion } from "@/api/requisiciones"
import { listarProveedoresActivos } from "@/api/proformas"
import { PRIORIDAD_STYLE, ESTADO_SOL_STYLE } from "@/models/solicitudes"
import { ApiError } from "@/api/client"
import { generarValeSalidaPdf } from "@/lib/valeSalidaPdf"
import NuevaRecepcionModal from "@/views/bodega/NuevaRecepcionModal"
import VerificarRecepcionModal from "@/views/bodega/VerificarRecepcionModal"
import NuevoValeModal from "@/views/bodega/NuevoValeModal"
import DetalleValeModal from "@/views/bodega/DetalleValeModal"
import PdfViewerModal from "@/views/common/PdfViewerModal"

const ESTADO_REC_STYLE: Record<string, { bg: string; color: string }> = {
  "En Proceso": { bg: "#DCFCE7", color: "#16A34A" },
  Completa: { bg: "#DCFCE7", color: "#16A34A" },
  Parcial: { bg: "#FEF9C3", color: "#854D0E" },
  "Con Novedades": { bg: "#FEE2E2", color: "#DC2626" },
  Cancelada: { bg: "var(--gray-100)", color: "#64748B" },
}

const ESTADO_VALE_STYLE: Record<string, { bg: string; color: string }> = {
  Pendiente: { bg: "var(--gray-100)", color: "#64748B" },
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
  const [pdfVale, setPdfVale] = useState<{ src: string; nombre: string } | null>(null)
  const [detalleVale, setDetalleVale] = useState<ValeSalidaDetalle | null>(null)
  const [verifRecepcion, setVerifRecepcion] = useState<Recepcion | null>(null)
  const [detalleRecepcion, setDetalleRecepcion] = useState<Recepcion | null>(null)
  const [rechazoRow, setRechazoRow] = useState<Requisicion | null>(null)
  const [motivo, setMotivo] = useState("")
  const [workingSol, setWorkingSol] = useState(false)
  const [detalleSol, setDetalleSol] = useState<Requisicion | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [pdfPreview, setPdfPreview] = useState<number | null>(null)
  const [mostrarModalProveedor, setMostrarModalProveedor] = useState(false)
  const [proveedores, setProveedores] = useState<{ id_proveedor: number; razon_social: string; nit: string; correo: string }[]>([])
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<number | null>(null)
  const [busquedaProveedor, setBusquedaProveedor] = useState("")
  const [asignandoProveedor, setAsignandoProveedor] = useState(false)

  useEffect(() => {
    if (!mostrarModalProveedor) return
    listarProveedoresActivos()
      .then((res) => setProveedores(res))
      .catch(() => setProveedores([]))
  }, [mostrarModalProveedor])

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

  const abrirModalProveedor = (r: Requisicion) => {
    setDetalleSol(r)
    setMostrarModalProveedor(true)
    setProveedorSeleccionado(null)
    setBusquedaProveedor("")
  }

  const aprobarAdjudicada = async (r: Requisicion) => {
    if (!r.id_orden_compra) return
    setWorkingSol(true)
    try {
      await aprobarOrdenAdjudicada(r.id_orden_compra)
      onToast("Orden aprobada", "La orden quedó Aprobada y disponible en facturación.")
      setDetalleSol(null)
      reload()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo aprobar la orden")
    } finally {
      setWorkingSol(false)
    }
  }

  const confirmarAsignacion = async () => {
    if (!detalleSol || !proveedorSeleccionado) return
    const prov = proveedores.find((p) => p.id_proveedor === proveedorSeleccionado)
    setAsignandoProveedor(true)
    try {
      await asignarProveedorRequisicion(detalleSol.id_requisicion, proveedorSeleccionado)
      onToast("Proveedor asignado", `Se envió la información del pedido a ${prov?.razon_social}.`)
      setMostrarModalProveedor(false)
      reload()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo asignar el proveedor")
    } finally {
      setAsignandoProveedor(false)
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

  const imprimirVale = async (v: ValeSalida) => {
    try {
      const det = await obtenerValeSalida(v.id_vale_salida)
      const blob = await generarValeSalidaPdf({
        id_vale_salida: det.id_vale_salida,
        fecha_salida: det.fecha_salida,
        justificacion: det.justificacion,
        nombre_dependencia: det.nombre_dependencia,
        nombre_solicitante: det.nombre_solicitante,
        items: det.items,
      })
      if (pdfVale) URL.revokeObjectURL(pdfVale.src)
      setPdfVale({
        src: URL.createObjectURL(blob),
        nombre: `Vale_Salida_S-2026-${det.id_vale_salida}.pdf`,
      })
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo generar el PDF del vale")
    }
  }

  const cerrarValePdf = () => {
    if (pdfVale) URL.revokeObjectURL(pdfVale.src)
    setPdfVale(null)
  }

  const abrirDetalleVale = async (v: ValeSalida) => {
    try {
      const det = await obtenerValeSalida(v.id_vale_salida)
      setDetalleVale(det)
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo cargar el detalle del vale")
    }
  }

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "var(--gray-50)" }}>
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
                style={tab === t ? { backgroundColor: G, color: "white" } : { color: "#6B7280", border: "1px solid #E5E7EB", backgroundColor: "var(--gray-50)" }}
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
                        const est = ESTADO_REC_STYLE[r.estado] ?? { bg: "var(--gray-100)", color: "#64748B" }
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
                                <button onClick={() => setDetalleRecepcion(r)} className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
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
                      {["DEPENDENCIA", "SOLICITANTE", "JUSTIFICACIÓN", "FECHA", "ESTADO"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vales.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">Sin vales de salida registrados.</td></tr>
                    ) : (
                      vales.map((v) => {
                        const est = ESTADO_VALE_STYLE[v.estado] ?? { bg: "var(--gray-100)", color: "#64748B" }
                        return (
                          <tr key={v.id_vale_salida} onClick={() => abrirDetalleVale(v)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors cursor-pointer">
                            <td className="px-4 py-4"><p className="text-sm font-medium text-gray-800">{v.nombre_dependencia}</p></td>
                            <td className="px-4 py-4"><p className="text-sm text-gray-600">{v.nombre_usuario}</p></td>
                            <td className="px-4 py-4"><p className="text-xs text-gray-500 max-w-[220px] truncate">{v.justificacion || "—"}</p></td>
                            <td className="px-4 py-4 whitespace-nowrap"><p className="text-sm text-gray-600 font-mono">{fmtFecha(v.fecha_salida)}</p></td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap" style={{ backgroundColor: est.bg, color: est.color }}>
                                  {v.estado}
                                </span>
                                {v.estado === "Entregado" && (
                                  <button
                                    title="Imprimir vale de salida"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      imprimirVale(v)
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-green-50"
                                    style={{ color: G }}
                                  >
                                    <Icons.Printer />
                                  </button>
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
          onSuccess={() => {
            setShowNuevaRec(false)
            reload()
            setTab("recepciones")
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
      {pdfVale && (
        <PdfViewerModal
          src={pdfVale.src}
          nombre={pdfVale.nombre}
          titulo="Vale de Salida"
          onClose={cerrarValePdf}
        />
      )}
      {detalleVale && (
        <DetalleValeModal
          vale={detalleVale}
          onClose={() => setDetalleVale(null)}
          onChanged={() => {
            setDetalleVale(null)
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
      {detalleRecepcion && (
        <VerificarRecepcionModal
          recepcion={detalleRecepcion}
          onClose={() => setDetalleRecepcion(null)}
          onChanged={() => {
            setDetalleRecepcion(null)
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
              {detalleSol.estado === "En Revisión" && detalleSol.adjudicada ? (
                <button
                  disabled={workingSol}
                  onClick={() => aprobarAdjudicada(detalleSol)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
                  style={{ backgroundColor: "#16A34A" }}
                >
                  <Icons.CheckMark /> Aprobar
                </button>
              ) : detalleSol.estado === "En Revisión" ? (
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
              ) : null}
              {detalleSol.estado === "Aprobada" && detalleSol.adjudicada ? (
                <span className="text-xs font-semibold text-gray-500">
                  Disponible en facturación
                </span>
              ) : detalleSol.estado === "Aprobada" ? (
                <button
                  onClick={() => abrirModalProveedor(detalleSol)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: G }}
                >
                  <Icons.ArrowRight /> Asignar Proveedor
                </button>
              ) : null}
            </div>
           </aside>
        </div>
      )}

      {mostrarModalProveedor && detalleSol && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            onClick={() => setMostrarModalProveedor(false)}
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(1.5px)" }}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Asignar Proveedor</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Seleccione el proveedor que recibirá la información del pedido {detalleSol.codigo_requisicion}
                </p>
              </div>
              <button
                onClick={() => setMostrarModalProveedor(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Icons.X />
              </button>
            </div>
            <div className="px-6 py-4 border-b border-gray-100">
              <input
                type="text"
                value={busquedaProveedor}
                onChange={(e) => setBusquedaProveedor(e.target.value)}
                placeholder="Buscar por nombre o NIT…"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {proveedores.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Cargando proveedores…</p>
              ) : (
                proveedores
                  .filter((p) =>
                    p.razon_social.toLowerCase().includes(busquedaProveedor.toLowerCase()) ||
                    p.nit.includes(busquedaProveedor)
                  )
                  .map((p) => (
                    <button
                      key={p.id_proveedor}
                      onClick={() => setProveedorSeleccionado(p.id_proveedor)}
                      className="w-full flex items-center gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}
                      >
                        <Icons.Boxes />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{p.razon_social}</p>
                        <p className="text-xs text-gray-500">NIT {p.nit} · {p.correo}</p>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border-2 shrink-0 transition-all"
                        style={{
                          borderColor: proveedorSeleccionado === p.id_proveedor ? G : "#D1D5DB",
                          backgroundColor: proveedorSeleccionado === p.id_proveedor ? G : "transparent",
                        }}
                      />
                    </button>
                  ))
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setMostrarModalProveedor(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAsignacion}
                disabled={!proveedorSeleccionado || asignandoProveedor}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
                style={{ backgroundColor: G }}
              >
                {asignandoProveedor ? "Asignando…" : "Confirmar Asignación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
