import { useState } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { adjudicarProceso, type OrdenInvitado, type ProformaRecibidaDetalle } from "@/api/proformas"
import { ApiError } from "@/api/client"
import ProformaDocumento from "@/views/proformas/ProformaDocumento"
import { fmtFecha } from "@/utils/fechas"

const fmtQ = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

const FASE_STYLE: Record<string, string> = {
  Publicada: "bg-sky-50 text-sky-700 border border-sky-200",
  Comparación: "bg-amber-50 text-amber-700 border border-amber-200",
  Adjudicada: "bg-green-50 text-green-700 border border-green-200",
  Desierta: "bg-slate-100 text-slate-500 border border-slate-200",
}

export interface ProcesoAdjudicar {
  id_proceso: number
  codigo_requisicion: string
  nombre_dependencia: string
  tipo_solicitud: string
  fase_proceso: string | null
  fecha_publicacion: string | null
  monto_estimado: string
  invitados: OrdenInvitado[]
}

export default function ProcesoAdjudicacionCard({
  proceso,
  onToast,
  onAdjudicada,
}: {
  proceso: ProcesoAdjudicar
  onToast: (m: string, s: string) => void
  onAdjudicada: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [selected, setSelected] = useState<number | null>(
    proceso.invitados.find((i) => i.seleccionada)?.id_cotizacion ?? null,
  )
  const [verItems, setVerItems] = useState<Record<number, boolean>>({})
  const [motivo, setMotivo] = useState("")
  const [working, setWorking] = useState(false)
  const [imprimiendo, setImprimiendo] = useState<OrdenInvitado | null>(null)

  const toggleVer = (idProveedor: number) =>
    setVerItems((prev) => ({ ...prev, [idProveedor]: !prev[idProveedor] }))

  const adjudicar = async () => {
    if (selected == null) {
      onToast("Revisar formulario", "Seleccione la cotización ganadora con el check.")
      return
    }
    if (!motivo.trim()) {
      onToast("Revisar formulario", "El motivo de adjudicación es obligatorio.")
      return
    }
    setWorking(true)
    try {
      await adjudicarProceso(proceso.id_proceso, {
        id_cotizacion: selected,
        motivo_adjudicacion: motivo.trim(),
      })
      onToast("Oferta adjudicada", "Orden de compra generada y proveedores notificados.")
      onAdjudicada()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo adjudicar")
    } finally {
      setWorking(false)
    }
  }

  const detalleImprimir = (inv: OrdenInvitado): ProformaRecibidaDetalle =>
    ({
      id_cotizacion: inv.id_cotizacion ?? 0,
      numero_cotizacion: inv.numero_cotizacion ?? "",
      fecha_cotizacion: inv.fecha_cotizacion ?? "",
      razon_social: inv.razon_social,
      nit: inv.nit,
      correo: inv.correo ?? "",
      telefono: inv.telefono ?? null,
      codigo_requisicion: proceso.codigo_requisicion,
      nombre_dependencia: proceso.nombre_dependencia,
      tipo_solicitud: proceso.tipo_solicitud,
      lugar_entrega: null,
      condiciones_pago: inv.condiciones_pago ?? null,
      tiempo_entrega_dias: inv.tiempo_entrega_dias ?? null,
      tiempo_entrega_texto: inv.tiempo_entrega_texto ?? null,
      monto_total: inv.monto_total ?? "0",
      items: inv.items,
    }) as unknown as ProformaRecibidaDetalle

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left border-b border-gray-100 bg-gray-50/60 transition-colors hover:bg-gray-100/60"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-extrabold" style={{ color: G }}>
              {proceso.codigo_requisicion}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500">{proceso.nombre_dependencia}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enviado a {proceso.invitados.length} {proceso.invitados.length === 1 ? "proveedor" : "proveedores"} ·{" "}
            Estimado {fmtQ(proceso.monto_estimado)} · {fmtFecha(proceso.fecha_publicacion)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
              FASE_STYLE[proceso.fase_proceso ?? ""] ?? "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
          >
            {proceso.fase_proceso ?? "Pendiente"}
          </span>
          {expanded ? <Icons.ChevUp /> : <Icons.ChevDown />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Proformas recibidas
            </p>
            <p className="text-[11px] text-gray-400">
              Marque el check del proveedor ganador
            </p>
          </div>

          <div className="space-y-2">
            {proceso.invitados.map((inv) => {
              const isSelected = selected === inv.id_cotizacion
              const showItems = !!verItems[inv.id_proveedor]
              return (
                <div
                  key={inv.id_proveedor}
                  className="rounded-xl border transition-colors"
                  style={{
                    borderColor: isSelected ? G : "#E5E7EB",
                    backgroundColor: isSelected ? GL : "#FFFFFF",
                  }}
                >
                  <div className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => inv.id_cotizacion && setSelected(inv.id_cotizacion)}
                        className="mt-0.5 shrink-0"
                        title="Seleccionar como ganadora"
                      >
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all"
                          style={{
                            borderColor: isSelected ? G : "#D1D5DB",
                            backgroundColor: isSelected ? G : "transparent",
                          }}
                        >
                          {isSelected && <Icons.CheckMark />}
                        </span>
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-gray-900">{inv.razon_social}</p>
                        <p className="text-[11px] text-gray-400 font-mono">
                          {inv.nit} · {inv.numero_cotizacion ?? "Sin cotización"}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 flex-wrap">
                          <span>
                            Entrega:{" "}
                            <b className="text-gray-700">
                              {inv.tiempo_entrega_dias != null ? `${inv.tiempo_entrega_dias} días` : "—"}
                            </b>
                          </span>
                          {inv.cumple_tecnico === true && (
                            <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                              <Icons.ShieldCheck /> Cumple
                            </span>
                          )}
                          {inv.cumple_tecnico === false && (
                            <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                              <Icons.Warning /> No cumple
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monto</p>
                        <p className="text-base font-extrabold font-mono" style={{ color: isSelected ? G : "#111827" }}>
                          {inv.monto_total ? fmtQ(inv.monto_total) : "—"}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleVer(inv.id_proveedor)}
                        className="px-2.5 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        {showItems ? "Ocultar" : "Ver"}
                      </button>
                      <button
                        onClick={() => inv.id_cotizacion && setImprimiendo(inv)}
                        disabled={!inv.id_cotizacion}
                        className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40"
                      >
                        <Icons.PDF /> Imprimir
                      </button>
                    </div>
                  </div>

                  {showItems && inv.items.length > 0 && (
                    <div className="px-4 pb-3">
                      <div className="rounded-lg border border-gray-100 divide-y divide-gray-50">
                        {inv.items.map((it) => (
                          <div
                            key={it.id_detalle_cotizacion}
                            className="px-3 py-2 flex items-center justify-between gap-3"
                          >
                            <span className="text-xs text-gray-600 truncate">{it.descripcion}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-[11px] text-gray-400 font-mono">
                                {Number(it.cantidad_cotizada).toLocaleString("es-GT")} {it.unidad_simbolo}
                              </span>
                              <span className="text-xs font-mono font-semibold text-gray-800">
                                {fmtQ(it.subtotal)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-1.5 pt-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Motivo de Adjudicación *
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Justifique la selección de esta oferta (precio, tiempo, cumplimiento técnico)…"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none focus:border-green-600"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={adjudicar}
              disabled={working || selected == null}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
              style={{ backgroundColor: G }}
            >
              <Icons.CheckMark />
              {working ? "Adjudicando…" : "Adjudicar Ganadora"}
            </button>
          </div>
        </div>
      )}

      {imprimiendo && (
        <ProformaDocumento detalle={detalleImprimir(imprimiendo)} onClose={() => setImprimiendo(null)} />
      )}
    </div>
  )
}
