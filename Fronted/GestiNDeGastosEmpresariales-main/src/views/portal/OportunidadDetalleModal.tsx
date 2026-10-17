import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import type { OportunidadDetalle } from "@/api/portal"

const fmtQ = (n: number | string) =>
  `Q ${Number(n || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

const fmtFecha = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-GT") : "—"

const ESTADO_BADGE: Record<string, { bg: string; color: string }> = {
  Nueva: { bg: "#E0F2FE", color: "#0284C7" },
  Abierta: { bg: "#E0F2FE", color: "#0284C7" },
  Cotizada: { bg: "#DCFCE7", color: "#16A34A" },
  Adjudicada: { bg: "#22C55E", color: "#FFFFFF" },
  "No adjudicada": { bg: "#FEE2E2", color: "#DC2626" },
  Declinada: { bg: "#F3F4F6", color: "#6B7280" },
  Vencida: { bg: "#FEF9C3", color: "#92400E" },
  Cancelada: { bg: "#F3F4F6", color: "#6B7280" },
  Cerrada: { bg: "#F3F4F6", color: "#6B7280" },
}

export default function OportunidadDetalleModal({
  detalle,
  onClose,
  dark,
}: {
  detalle: OportunidadDetalle
  onClose: () => void
  dark: boolean
}) {
  const es = ESTADO_BADGE[detalle.estado] ?? { bg: "#F3F4F6", color: "#6B7280" }
  const card = dark ? "#1E293B" : "#FFFFFF"
  const border = dark ? "#334155" : "#E5E7EB"
  const text = dark ? "#F1F5F9" : "#1F2937"
  const sub = dark ? "#94A3B8" : "#6B7280"

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.52)", backdropFilter: "blur(1px)" }}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        style={{ backgroundColor: card, animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: border }}>
          <div className="min-w-0">
            <h2 className="text-lg font-bold" style={{ color: text }}>{detalle.codigo_requisicion}</h2>
            <p className="text-xs" style={{ color: sub }}>{detalle.dependencia} · {detalle.tipo_solicitud}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: es.bg, color: es.color }}>
              {detalle.estado}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-all" style={{ color: sub }}>
              <Icons.X />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3" style={{ borderColor: border }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Dependencia</p>
              <p className="text-sm font-semibold mt-1" style={{ color: text }}>{detalle.dependencia}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: border }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Monto Estimado</p>
              <p className="text-sm font-semibold mt-1 font-mono" style={{ color: G }}>{fmtQ(detalle.monto_estimado)}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: border }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Prioridad</p>
              <p className="text-sm font-semibold mt-1" style={{ color: text }}>{detalle.prioridad}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: border }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Fecha Límite</p>
              <p className="text-sm font-semibold mt-1" style={{ color: text }}>{fmtFecha(detalle.fecha_limite)}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: border }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Publicado</p>
              <p className="text-sm font-semibold mt-1" style={{ color: text }}>{fmtFecha(detalle.fecha_publicacion)}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: border }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: sub }}>Lugar de Entrega</p>
              <p className="text-sm font-semibold mt-1" style={{ color: text }}>{detalle.lugar_entrega ?? "—"}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: sub }}>
              Ítems Solicitados ({detalle.items.length})
            </p>
            <div className="rounded-xl border divide-y" style={{ borderColor: border, backgroundColor: dark ? "#0F172A" : "#F9FAFB" }}>
              {detalle.items.map((it) => (
                <div key={it.id_detalle} className="px-4 py-3">
                  <p className="text-sm font-semibold" style={{ color: text }}>
                    {it.insumo_nombre ?? it.descripcion_libre ?? "—"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: sub }}>
                    {Number(it.cantidad).toLocaleString("es-GT")} {it.unidad_simbolo}
                    {it.observaciones ? ` · ${it.observaciones}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: sub }}>Justificación</p>
            <p className="text-sm rounded-lg border p-3 leading-relaxed" style={{ color: text, borderColor: border, backgroundColor: dark ? "#0F172A" : "#F9FAFB" }}>
              {detalle.justificacion}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
