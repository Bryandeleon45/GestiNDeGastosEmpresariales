import { useEffect, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  listarCotizacionesRecibidas,
  obtenerCotizacion,
  cambiarEstadoCotizacion,
  type ProformaRecibidaItem,
  type ProformaRecibidaDetalle,
} from "@/api/proformas"
import { ApiError } from "@/api/client"
import ProformaDocumento from "@/views/proformas/ProformaDocumento"
import { fmtFecha } from "@/utils/fechas"

const fmtQ = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

const ESTADO_STYLE: Record<string, string> = {
  Recibida: "bg-sky-50 text-sky-700 border border-sky-200",
  "En Evaluación": "bg-amber-50 text-amber-700 border border-amber-200",
  Aceptada: "bg-green-50 text-green-700 border border-green-200",
  Rechazada: "bg-red-50 text-red-600 border border-red-200",
}

export default function ProformasRecibidasView({
  onToast,
  onVerComparativa,
}: {
  onToast: (m: string, s: string) => void
  onVerComparativa: (idProceso: number) => void
}) {
  const [data, setData] = useState<ProformaRecibidaItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")
  const [detalle, setDetalle] = useState<ProformaRecibidaDetalle | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [working, setWorking] = useState(false)
  const [docProforma, setDocProforma] = useState(false)

  const cargar = async (p = 1, q = "", estado = "") => {
    setLoading(true)
    try {
      const res = await listarCotizacionesRecibidas({
        page: p,
        pageSize: 20,
        q: q || undefined,
        estado: estado || undefined,
      })
      setData(res.data)
      setTotal(res.total)
      setPage(res.page)
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudieron cargar las proformas")
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const verDetalle = async (id: number) => {
    setCargandoDetalle(true)
    try {
      const d = await obtenerCotizacion(id)
      setDetalle(d)
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo cargar el detalle")
    } finally {
      setCargandoDetalle(false)
    }
  }

  const cambiarEstado = async (id: number, estado: string) => {
    setWorking(true)
    try {
      await cambiarEstadoCotizacion(id, estado)
      onToast("Estado actualizado", `La proforma pasó a ${estado}.`)
      if (detalle?.id_cotizacion === id) {
        const d = await obtenerCotizacion(id)
        setDetalle(d)
      }
      cargar(page, busqueda, filtroEstado)
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo cambiar el estado")
    } finally {
      setWorking(false)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold" style={{ color: G }}>
            Proformas Recibidas
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cotizaciones enviadas por los proveedores desde el portal.
          </p>
        </div>

        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && cargar(1, busqueda, filtroEstado)}
              placeholder="Buscar por proveedor, solicitud o cotización..."
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); cargar(1, busqueda, e.target.value) }}
            className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
          >
            <option value="">Todos los estados</option>
            <option value="Recibida">Recibida</option>
            <option value="En Evaluación">En Evaluación</option>
            <option value="Aceptada">Aceptada</option>
            <option value="Rechazada">Rechazada</option>
          </select>
          <button
            onClick={() => cargar(1, busqueda, filtroEstado)}
            className="px-4 py-2.5 text-sm font-bold text-white rounded-lg"
            style={{ backgroundColor: G }}
          >
            Buscar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["COTIZACIÓN", "PROVEEDOR", "SOLICITUD", "MONTO", "ESTADO", "FECHA", "ACCIONES"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap bg-gray-50"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    Cargando proformas…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    No hay proformas recibidas.
                  </td>
                </tr>
              ) : (
                data.map((c) => (
                  <tr key={c.id_cotizacion} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-xs font-bold font-mono text-gray-700">{c.numero_cotizacion}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{c.origen}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-800">{c.razon_social}</p>
                      <p className="text-[11px] text-gray-400">{c.nit}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-mono text-gray-600">{c.codigo_requisicion}</p>
                      <p className="text-[11px] text-gray-400">{c.tipo_solicitud}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold font-mono text-gray-800">{fmtQ(c.monto_total)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${ESTADO_STYLE[c.estado_cotizacion] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {c.estado_cotizacion}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600 font-mono">{fmtFecha(c.fecha_envio)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => verDetalle(c.id_cotizacion)}
                          className="text-sm font-bold transition-colors hover:opacity-70"
                          style={{ color: G }}
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => { verDetalle(c.id_cotizacion); setDocProforma(true) }}
                          className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          Imprimir
                        </button>
                        <button
                          onClick={() => onVerComparativa(c.id_proceso)}
                          className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          Comparativa
                        </button>
                        {c.estado_cotizacion === "Recibida" && (
                          <button
                            disabled={working}
                            onClick={() => cambiarEstado(c.id_cotizacion, "En Evaluación")}
                            className="text-sm font-semibold text-amber-600 hover:text-amber-800 transition-colors disabled:opacity-40"
                          >
                            Evaluar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Mostrando {data.length} de {total} proformas
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => cargar(page - 1, busqueda, filtroEstado)}
                className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm font-bold text-gray-700">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => cargar(page + 1, busqueda, filtroEstado)}
                className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {detalle && (
        <div
          onClick={(e) => e.target === e.currentTarget && setDetalle(null)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.52)", backdropFilter: "blur(1px)" }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
            style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{detalle.numero_cotizacion}</h2>
                <p className="text-xs text-gray-500">{detalle.razon_social} · {detalle.nit}</p>
              </div>
              <button onClick={() => setDetalle(null)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                <Icons.X />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {cargandoDetalle && (
                <p className="text-sm text-gray-500 text-center py-4">Cargando detalle...</p>
              )}

              {!cargandoDetalle && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Solicitud</p>
                      <p className="text-sm font-semibold mt-1 text-gray-800">{detalle.codigo_requisicion}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Dependencia</p>
                      <p className="text-sm font-semibold mt-1 text-gray-800">{detalle.nombre_dependencia}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Monto Total</p>
                      <p className="text-sm font-bold mt-1 font-mono" style={{ color: G }}>{fmtQ(detalle.monto_total)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Condiciones de Pago</p>
                      <p className="text-sm font-semibold mt-1 text-gray-800">{detalle.condiciones_pago ?? "—"}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Tiempo de Entrega</p>
                      <p className="text-sm font-semibold mt-1 text-gray-800">
                        {detalle.tiempo_entrega_dias ? `${detalle.tiempo_entrega_dias} días` : detalle.tiempo_entrega_texto ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Estado</p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${ESTADO_STYLE[detalle.estado_cotizacion] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {detalle.estado_cotizacion}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Ítems de la Cotización</p>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            {["DESCRIPCIÓN", "CANT. SOLICITADA", "PRECIO UNIT.", "SUBTOTAL"].map((h) => (
                              <th key={h} className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detalle.items.map((it) => (
                            <tr key={it.id_detalle_cotizacion} className="border-b border-gray-50 last:border-0">
                              <td className="px-4 py-3">
                                <p className="text-sm font-semibold text-gray-800">{it.descripcion}</p>
                                {it.descripcion_oferta && (
                                  <p className="text-xs text-gray-500 mt-0.5">{it.descripcion_oferta}</p>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                {it.cantidad_solicitada} {it.unidad_simbolo}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                {fmtQ(it.precio_unitario)}
                              </td>
                              <td className="px-4 py-3 text-sm font-bold font-mono text-gray-800">
                                {fmtQ(it.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {detalle.observaciones_tecnicas && (
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1">Observaciones Técnicas</p>
                      <p className="text-sm rounded-lg border border-gray-200 p-3 text-gray-700 bg-gray-50">
                        {detalle.observaciones_tecnicas}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              {detalle.estado_cotizacion === "Recibida" && (
                <button
                  disabled={working}
                  onClick={() => cambiarEstado(detalle.id_cotizacion, "En Evaluación")}
                  className="px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#D97706" }}
                >
                  Marcar En Evaluación
                </button>
              )}
              {detalle.estado_cotizacion === "En Evaluación" && (
                <>
                  <button
                    disabled={working}
                    onClick={() => cambiarEstado(detalle.id_cotizacion, "Rechazada")}
                    className="px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#DC2626" }}
                  >
                    Rechazar
                  </button>
                  <button
                    disabled={working}
                    onClick={() => cambiarEstado(detalle.id_cotizacion, "Aceptada")}
                    className="px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: G }}
                  >
                    Aceptar
                  </button>
                </>
              )}
              <button
                onClick={() => setDetalle(null)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {docProforma && detalle && (
        <ProformaDocumento detalle={detalle} onClose={() => setDocProforma(false)} />
      )}
    </>
  )
}
