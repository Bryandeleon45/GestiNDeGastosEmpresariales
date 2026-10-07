import { useState, useEffect, useMemo } from "react"
import { G, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import type { OportunidadDetalle } from "@/api/portal"

const fmtQ = (n: number) =>
  `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

export default function CotizarOportunidadModal({
  detalle,
  dark,
  onClose,
  onToast,
  onGuardar,
  onEnviar,
  onDeclinar,
  onSuccess,
}: {
  detalle: OportunidadDetalle
  dark: boolean
  onClose: () => void
  onToast: (m: string, s: string) => void
  onGuardar: (idProceso: number, data: unknown) => Promise<unknown>
  onEnviar: (idProceso: number) => Promise<{ constancia?: string }>
  onDeclinar: (idProceso: number, motivo?: string) => Promise<unknown>
  onSuccess: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const borrador = detalle.cotizacion?.estado_cotizacion === "Borrador" ? detalle.cotizacion : null
  const detItems = detalle.cotizacion?.items ?? []

  const precioInicial = (idDetalle: number) => {
    const d = detItems.find((x) => x.id_detalle_requisicion === idDetalle)
    return d ? d.precio_unitario : ""
  }

  const [precios, setPrecios] = useState<Record<number, string>>({})
  const [condiciones, setCondiciones] = useState(detalle.cotizacion?.condiciones_pago ?? "")
  const [tiempo, setTiempo] = useState(
    detalle.cotizacion?.tiempo_entrega_texto ??
      (detalle.cotizacion?.tiempo_entrega_dias != null
        ? `${detalle.cotizacion.tiempo_entrega_dias} días`
        : ""),
  )
  const [referencia, setReferencia] = useState(detalle.cotizacion?.referencia_proveedor ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [declinando, setDeclinando] = useState(false)
  const [motivo, setMotivo] = useState("")

  const setPrecio = (id: number, v: string) => setPrecios((p) => ({ ...p, [id]: v }))

  const total = useMemo(() => {
    let sum = 0
    for (const it of detalle.items) {
      const p = parseFloat(precios[it.id_detalle] || "")
      if (Number.isFinite(p)) sum += parseFloat(it.cantidad) * p
    }
    return sum
  }, [precios, detalle.items])

  const completos = detalle.items.every((it) => {
    const p = parseFloat(precios[it.id_detalle] || "")
    return Number.isFinite(p) && p > 0
  })

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const buildItems = () =>
    detalle.items.map((it) => ({
      id_detalle_requisicion: it.id_detalle,
      precio_unitario: parseFloat(precios[it.id_detalle] || "").toFixed(2),
    }))

  const guardar = async () => {
    if (!completos) {
      setError("Debe ingresar un precio válido para todos los ítems.")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      await onGuardar(detalle.id_proceso, {
        condiciones_pago: condiciones,
        tiempo_entrega_texto: tiempo,
        referencia_proveedor: referencia,
        items: buildItems(),
      })
      onToast("Borrador guardado", "Su cotización quedó guardada como borrador.")
    } catch (e) {
      setError((e as Error).message || "No se pudo guardar el borrador.")
    } finally {
      setSubmitting(false)
    }
  }

  const enviar = async () => {
    if (!completos) {
      setError("Debe ingresar un precio válido para todos los ítems.")
      return
    }
    if (!condiciones.trim()) {
      setError("Las condiciones de pago son obligatorias.")
      return
    }
    if (!tiempo.trim()) {
      setError("El tiempo de entrega es obligatorio.")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      await onGuardar(detalle.id_proceso, {
        condiciones_pago: condiciones,
        tiempo_entrega_texto: tiempo,
        referencia_proveedor: referencia,
        items: buildItems(),
      })
      const res = await onEnviar(detalle.id_proceso)
      handleClose()
      setTimeout(() => {
        onToast("Cotización enviada", res.constancia || "Su cotización fue enviada a evaluación.")
        onSuccess()
      }, 300)
    } catch (e) {
      setError((e as Error).message || "No se pudo enviar la cotización.")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmarDeclinar = async () => {
    setSubmitting(true)
    try {
      await onDeclinar(detalle.id_proceso, motivo.trim() || undefined)
      handleClose()
      setTimeout(() => {
        onToast("Oportunidad declinada", "Se registró su declinación de la oportunidad.")
        onSuccess()
      }, 300)
    } catch (e) {
      setError((e as Error).message || "No se pudo declinar la oportunidad.")
      setSubmitting(false)
    }
  }

  const card = dark ? "#1E293B" : "#FFFFFF"
  const text = dark ? "#F8FAFC" : "#111827"
  const sub = dark ? "#94A3B8" : "#6B7280"
  const border = dark ? "#334155" : "#F3F4F6"
  const inputBg = dark ? "#0F172A" : "#F9FAFB"

  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.6 : 0})`,
          backdropFilter: "blur(3px)",
          transition: "background-color 0.28s",
        }}
      />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
          style={{ backgroundColor: card, animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
        >
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b" style={{ borderColor: border }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: G }}>
              <Icons.Proformas />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold leading-none" style={{ color: text }}>
                Cotizar Oportunidad
              </h2>
              <p className="text-xs mt-0.5 truncate" style={{ color: sub }}>
                {detalle.codigo_requisicion} · {detalle.tipo_solicitud}
              </p>
            </div>
            <button onClick={handleClose} className="ml-auto p-1.5 rounded-lg transition-all hover:opacity-70" style={{ color: sub }}>
              <Icons.X />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="rounded-xl px-4 py-3 text-xs leading-relaxed border" style={{ backgroundColor: dark ? "rgba(30,94,47,0.15)" : "#F0FDF4", borderColor: dark ? "rgba(30,94,47,0.3)" : GB, color: dark ? "#86EFAC" : G }}>
              <p className="font-semibold">Requerimiento de {detalle.dependencia}</p>
              <p className="mt-1">{detalle.justificacion}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <span>Fecha límite: <b>{fmtFecha(detalle.fecha_limite)}</b></span>
                <span>Prioridad: <b>{detalle.prioridad}</b></span>
                {detalle.lugar_entrega && <span>Entrega: <b>{detalle.lugar_entrega}</b></span>}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold mb-2" style={{ color: sub }}>
                ÍTEMS A COTIZAR
              </p>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: border }}>
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-extrabold uppercase tracking-wider" style={{ backgroundColor: dark ? "#0F172A" : "#F9FAFB", color: sub }}>
                      <th className="px-3 py-2 text-left">Descripción</th>
                      <th className="px-3 py-2 text-right">Cantidad</th>
                      <th className="px-3 py-2 text-right">Precio Unit. (Q)</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.items.map((it) => {
                      const nombre = it.insumo_nombre || it.descripcion_libre || "—"
                      const precio = precios[it.id_detalle] || precioInicial(it.id_detalle) || ""
                      const p = parseFloat(precio)
                      const subtotal = Number.isFinite(p) ? parseFloat(it.cantidad) * p : 0
                      return (
                        <tr key={it.id_detalle} className="border-t" style={{ borderColor: border }}>
                          <td className="px-3 py-2.5">
                            <p className="text-sm font-semibold" style={{ color: text }}>{nombre}</p>
                            {it.observaciones && <p className="text-[11px]" style={{ color: sub }}>{it.observaciones}</p>}
                          </td>
                          <td className="px-3 py-2.5 text-right text-sm font-mono" style={{ color: sub }}>
                            {parseFloat(it.cantidad).toLocaleString("es-GT")} {it.unidad_simbolo}
                          </td>
                          <td className="px-3 py-2.5" style={{ width: 120 }}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={precio}
                              onChange={(e) => setPrecio(it.id_detalle, e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1.5 text-sm text-right border-2 rounded-lg focus:outline-none transition-colors font-mono"
                              style={{ backgroundColor: inputBg, borderColor: precio ? G : border, color: text }}
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right text-sm font-mono font-bold" style={{ color: text }}>
                            {fmtQ(subtotal)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-2">
                <p className="text-sm" style={{ color: sub }}>
                  Total: <span className="font-extrabold font-mono text-lg" style={{ color: G }}>{fmtQ(total)}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold block mb-1.5" style={{ color: sub }}>Condiciones de Pago</label>
                <input
                  value={condiciones}
                  onChange={(e) => setCondiciones(e.target.value)}
                  placeholder="Ej. 30 días crédito"
                  className="w-full px-3 py-2.5 text-sm border-2 rounded-xl focus:outline-none transition-colors"
                  style={{ backgroundColor: inputBg, borderColor: condiciones ? G : border, color: text }}
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: sub }}>Tiempo de Entrega</label>
                <input
                  value={tiempo}
                  onChange={(e) => setTiempo(e.target.value)}
                  placeholder="Ej. 5 días hábiles"
                  className="w-full px-3 py-2.5 text-sm border-2 rounded-xl focus:outline-none transition-colors"
                  style={{ backgroundColor: inputBg, borderColor: tiempo ? G : border, color: text }}
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: sub }}>Referencia (opcional)</label>
                <input
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Ref. interna"
                  className="w-full px-3 py-2.5 text-sm border-2 rounded-xl focus:outline-none transition-colors"
                  style={{ backgroundColor: inputBg, borderColor: border, color: text }}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-2.5 text-xs font-semibold border" style={{ backgroundColor: "#FEE2E2", borderColor: "#FECACA", color: "#DC2626" }}>
                {error}
              </div>
            )}

            {declinando ? (
              <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: border }}>
                <p className="text-sm font-bold" style={{ color: text }}>Declinar oportunidad</p>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Motivo (opcional)"
                  className="w-full px-3 py-2.5 text-sm border-2 rounded-xl focus:outline-none transition-colors"
                  style={{ backgroundColor: inputBg, borderColor: border, color: text }}
                />
                <div className="flex gap-3">
                  <button onClick={() => setDeclinando(false)} className="px-4 py-2 text-sm font-semibold rounded-xl border transition-all" style={{ color: sub, borderColor: border }}>
                    Volver
                  </button>
                  <button onClick={confirmarDeclinar} disabled={submitting} className="flex-1 py-2 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90" style={{ backgroundColor: "#DC2626" }}>
                    Confirmar Declinación
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setDeclinando(true)}
                  className="px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all"
                  style={{ color: "#DC2626", borderColor: dark ? "#7F1D1D" : "#FECACA" }}
                >
                  Declinar
                </button>
                <div className="flex-1" />
                <button onClick={guardar} disabled={submitting} className="px-4 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all" style={{ color: G, borderColor: G }}>
                  Guardar Borrador
                </button>
                <button onClick={enviar} disabled={submitting || !completos} className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: G, opacity: !completos ? 0.5 : 1 }}>
                  Enviar Cotización
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
