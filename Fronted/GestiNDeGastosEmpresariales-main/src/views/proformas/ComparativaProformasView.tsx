import { useEffect, useState } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  obtenerComparativa,
  seleccionarCotizacion,
  type Comparativa,
  type ComparativaProveedor,
} from "@/api/proformas"
import { ApiError } from "@/api/client"
import AdjudicarModal from "@/views/proformas/AdjudicarModal"

const FASE_STYLE: Record<string, string> = {
  Publicada: "bg-sky-50 text-sky-700 border border-sky-200",
  Comparación: "bg-amber-50 text-amber-700 border border-amber-200",
  Adjudicada: "bg-green-50 text-green-700 border border-green-200",
  Desierta: "bg-slate-100 text-slate-500 border border-slate-200",
}

const fmt = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

const FASE_LABEL: Record<string, string> = {
  Publicada: "FASE: PUBLICADA",
  Comparación: "FASE: COMPARACIÓN",
  Adjudicada: "FASE: ADJUDICADO",
  Desierta: "FASE: DESIERTA",
}

export default function ComparativaProformasView({
  idProceso,
  onBack,
  onToast,
}: {
  idProceso: number
  onBack: () => void
  onToast: (m: string, s: string) => void
}) {
  const [data, setData] = useState<Comparativa | null>(null)
  const [loading, setLoading] = useState(true)
  const [winner, setWinner] = useState<number | null>(null)
  const [hoveredCol, setHoveredCol] = useState<number | null>(null)
  const [showAdjudicar, setShowAdjudicar] = useState(false)
  const [working, setWorking] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const d = await obtenerComparativa(idProceso)
      setData(d)
      const sel = d.proveedores.find((p) => p.seleccionada)
      setWinner(sel?.id_cotizacion ?? null)
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo cargar la comparativa")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [idProceso])

  const elegir = async (idCotizacion: number) => {
    setWorking(true)
    try {
      await seleccionarCotizacion(idCotizacion)
      setWinner(idCotizacion)
      await cargar()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo seleccionar")
    } finally {
      setWorking(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-20 text-center text-sm text-gray-400">Cargando comparativa…</div>
      </div>
    )
  }

  const { proceso, items, proveedores, mejorPrecio } = data
  const adjudicada = proceso.fase === "Adjudicada"
  const desierta = proceso.fase === "Desierta"
  const resuelta = adjudicada || desierta

  const menorTotal = proveedores.reduce(
    (min, p) => (Number(p.monto_total) < min ? Number(p.monto_total) : min),
    proveedores.length ? Number(proveedores[0].monto_total) : 0,
  )
  const masEconomico = proveedores.find((p) => Number(p.monto_total) === menorTotal)

  const menorEntrega = proveedores.reduce(
    (min, p) => (p.tiempo_entrega_dias != null && p.tiempo_entrega_dias < min ? p.tiempo_entrega_dias : min),
    proveedores.length && proveedores[0].tiempo_entrega_dias != null ? proveedores[0].tiempo_entrega_dias : Infinity,
  )
  const mejorEntrega = proveedores.find((p) => p.tiempo_entrega_dias === menorEntrega)

  const todosCumplen = proveedores.every((p) => p.cumple_tecnico === true)
  const noCumplen = proveedores.filter((p) => p.cumple_tecnico === false)

  return (
    <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
      <div className="px-6 py-5 space-y-5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 flex-wrap">
          <button onClick={onBack} className="hover:text-gray-600 transition-colors">
            Adquisiciones
          </button>
          <Icons.ChevRight />
          <span>Proformas</span>
          <Icons.ChevRight />
          <span style={{ color: G }}>Comparativa de Precios</span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
              Comparativa de Proformas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {proceso.codigo_requisicion} · {proceso.nombre_dependencia}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() =>
                onToast("Exportando cuadro comparativo…", "La exportación estará disponible próximamente.")
              }
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all hover:bg-gray-50"
              style={{ color: G, borderColor: G }}
            >
              <Icons.PDF /> Exportar Cuadro
            </button>
            {!resuelta && (
              <button
                onClick={() => {
                  if (!winner) {
                    onToast(
                      "Selecciona un proveedor ganador primero.",
                      "Haz clic en «Seleccionar Ganadora» en la tabla.",
                    )
                    return
                  }
                  setShowAdjudicar(true)
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90"
                style={{ backgroundColor: G }}
              >
                Finalizar Comparativa
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: G }}
              >
                <Icons.Doc />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 leading-none">
                  Solicitud de Compra {proceso.codigo_requisicion}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                  Resumen del Requerimiento
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wide border ${FASE_STYLE[proceso.fase]}`}
            >
              {FASE_LABEL[proceso.fase] ?? proceso.fase}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {[
              { label: "Dependencia Solicitante", value: proceso.nombre_dependencia, accent: false },
              { label: "Fecha de Publicación", value: new Date(proceso.fecha_publicacion).toLocaleDateString("es-GT"), accent: false },
              { label: "Presupuesto Estimado", value: fmt(proceso.monto_estimado), accent: true },
              { label: "Categoría", value: proceso.tipo_solicitud, accent: false },
            ].map((f) => (
              <div key={f.label} className="px-5 py-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{f.label}</p>
                <p className="text-sm font-bold mt-1 text-gray-900" style={f.accent ? { color: G } : {}}>
                  {f.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-4 text-left w-52 bg-gray-50 border-r border-gray-100 sticky left-0 z-10">
                    <p className="text-xs font-bold text-gray-700">Ítem / Descripción</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">CANT.</p>
                  </th>
                  {proveedores.map((prov) => {
                    const isWinner = winner === prov.id_cotizacion
                    const isHovered = hoveredCol === prov.id_cotizacion
                    return (
                      <th
                        key={prov.id_cotizacion}
                        onMouseEnter={() => setHoveredCol(prov.id_cotizacion)}
                        onMouseLeave={() => setHoveredCol(null)}
                        className="px-4 py-4 text-left border-r border-gray-100 last:border-r-0 transition-colors"
                        style={{
                          backgroundColor: isWinner ? GL : isHovered ? "#FAFFFE" : undefined,
                          minWidth: 200,
                        }}
                      >
                        <p className="text-sm font-extrabold leading-none" style={{ color: G }}>
                          {prov.razon_social}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border text-gray-600 border-gray-200 bg-gray-50">
                            {prov.nit}
                          </span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {items.map((item, itemIdx) => (
                  <tr key={item.id_detalle} className="border-b border-gray-50">
                    <td className="px-4 py-4 bg-white border-r border-gray-100 sticky left-0 z-10">
                      <p className="text-sm font-bold text-gray-900 leading-snug">
                        {item.insumo_nombre ?? item.descripcion_libre}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.unidad_nombre}
                      </p>
                      <p className="text-xs font-bold text-gray-500 mt-1">{Number(item.cantidad)}</p>
                    </td>
                    {proveedores.map((prov) => {
                      const cell = prov.items.find((x) => x && x.id_detalle_requisicion === item.id_detalle) ?? null
                      const isBest =
                        cell != null &&
                        mejorPrecio[itemIdx] != null &&
                        Number(cell.precio_unitario) === mejorPrecio[itemIdx]
                      const isWinner = winner === prov.id_cotizacion
                      return (
                        <td
                          key={prov.id_cotizacion}
                          onMouseEnter={() => setHoveredCol(prov.id_cotizacion)}
                          onMouseLeave={() => setHoveredCol(null)}
                          className="px-4 py-4 border-r border-gray-50 last:border-r-0 transition-colors"
                          style={{
                            backgroundColor: isWinner ? GL : hoveredCol === prov.id_cotizacion ? "#FAFFFE" : undefined,
                          }}
                        >
                          {cell ? (
                            <>
                              <p className="text-xs text-gray-500">U: {fmt(cell.precio_unitario)}</p>
                              <p className="text-sm font-extrabold text-gray-900 mt-0.5">{fmt(cell.subtotal)}</p>
                              {isBest && (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded"
                                  style={{ backgroundColor: GL, color: G }}
                                >
                                  <svg
                                    className="w-2.5 h-2.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                  >
                                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                                    <polyline points="17 18 23 18 23 12" />
                                  </svg>
                                  MEJOR PRECIO
                                </span>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Sin cotizar</p>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                <tr className="border-b border-gray-100" style={{ backgroundColor: "#F9FAFB" }}>
                  <td className="px-4 py-3.5 bg-gray-50 border-r border-gray-100 sticky left-0 z-10">
                    <p className="text-sm font-bold text-gray-700">Tiempo de Entrega</p>
                  </td>
                  {proveedores.map((prov) => {
                    const isWinner = winner === prov.id_cotizacion
                    return (
                      <td
                        key={prov.id_cotizacion}
                        className="px-4 py-3.5 border-r border-gray-100 last:border-r-0 transition-colors"
                        style={{
                          backgroundColor: isWinner ? GL : hoveredCol === prov.id_cotizacion ? "#FAFFFE" : "#F9FAFB",
                        }}
                      >
                        <p className="text-sm font-semibold text-gray-700">
                          {prov.tiempo_entrega_dias != null ? `${prov.tiempo_entrega_dias} días` : "—"}
                        </p>
                      </td>
                    )
                  })}
                </tr>

                <tr className="border-b border-gray-100">
                  <td className="px-4 py-4 bg-gray-50 border-r border-gray-100 sticky left-0 z-10">
                    <p className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Total General</p>
                  </td>
                  {proveedores.map((prov) => {
                    const isWinner = winner === prov.id_cotizacion
                    return (
                      <td
                        key={prov.id_cotizacion}
                        className="px-4 py-4 border-r border-gray-100 last:border-r-0 transition-colors"
                        style={{ backgroundColor: isWinner ? GL : hoveredCol === prov.id_cotizacion ? "#FAFFFE" : undefined }}
                      >
                        <p className="text-xl font-extrabold" style={{ color: isWinner ? G : "#111827" }}>
                          {fmt(prov.monto_total)}
                        </p>
                      </td>
                    )
                  })}
                </tr>

                {!resuelta && (
                  <tr>
                    <td className="px-4 py-4 bg-white border-r border-gray-100 sticky left-0 z-10" />
                    {proveedores.map((prov) => {
                      const isWinner = winner === prov.id_cotizacion
                      return (
                        <td
                          key={prov.id_cotizacion}
                          className="px-4 py-4 border-r border-gray-100 last:border-r-0 transition-colors"
                          style={{ backgroundColor: isWinner ? GL : undefined }}
                        >
                          {isWinner ? (
                            <button
                              onClick={() => setShowAdjudicar(true)}
                              disabled={working}
                              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm active:scale-95 disabled:opacity-50"
                              style={{ backgroundColor: G }}
                            >
                              <Icons.CheckMark />
                              Adjudicar Oferta
                            </button>
                          ) : (
                            <button
                              onClick={() => elegir(prov.id_cotizacion)}
                              disabled={working}
                              className="w-full py-2.5 text-sm font-semibold rounded-xl border-2 transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
                              style={{ color: G, borderColor: G }}
                            >
                              Seleccionar Ganadora
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: GL, color: G }}>
                <Icons.Tag />
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Oferta Más Económica</p>
            </div>
            {masEconomico ? (
              <>
                <p className="text-base font-extrabold mb-1" style={{ color: G }}>
                  {masEconomico.razon_social}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Total de {fmt(masEconomico.monto_total)} para todos los ítems cotizados.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Sin cotizaciones recibidas.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: GL, color: G }}>
                <Icons.Zap />
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Mejor Tiempo de Entrega</p>
            </div>
            {mejorEntrega && mejorEntrega.tiempo_entrega_dias != null ? (
              <>
                <p className="text-base font-extrabold mb-1" style={{ color: G }}>
                  {mejorEntrega.razon_social}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Entrega en {mejorEntrega.tiempo_entrega_dias} días.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Sin información de entrega.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: GL, color: G }}>
                <Icons.ShieldCheck />
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Cumplimiento Técnico</p>
            </div>
            {noCumplen.length > 0 ? (
              <>
                <p className="text-sm font-bold text-red-600 mb-1">Hay proveedores que no cumplen</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {noCumplen.map((p) => p.razon_social).join(", ")}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-sm font-bold text-gray-900">
                    {todosCumplen ? "Todos los proveedores cumplen" : "Sin evaluar"}
                  </p>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Se verifica la vigencia de RTU y patente de comercio.
                </p>
              </>
            )}
          </div>
        </div>

        {resuelta && (
          <div
            className="rounded-xl border px-5 py-4"
            style={{
              backgroundColor: adjudicada ? "#F0FDF4" : "#F8FAFC",
              borderColor: adjudicada ? "#BBF7D0" : "#E2E8F0",
            }}
          >
            <p className="text-sm font-bold" style={{ color: adjudicada ? "#166534" : "#475569" }}>
              {adjudicada
                ? `Proceso adjudicado${proceso.motivo_adjudicacion ? `: ${proceso.motivo_adjudicacion}` : ""}`
                : `Proceso desierto${proceso.motivo_adjudicacion ? `: ${proceso.motivo_adjudicacion}` : ""}`}
            </p>
          </div>
        )}
      </div>

      {showAdjudicar && winner != null && (
        <AdjudicarModal
          idProceso={idProceso}
          cotizacion={proveedores.find((p) => p.id_cotizacion === winner)!}
          items={items}
          onClose={() => setShowAdjudicar(false)}
          onSuccess={() => {
            setShowAdjudicar(false)
            onToast("¡Oferta adjudicada!", "Orden de compra generada correctamente.")
            cargar()
            onBack()
          }}
          onToast={onToast}
        />
      )}
    </div>
  )
}
