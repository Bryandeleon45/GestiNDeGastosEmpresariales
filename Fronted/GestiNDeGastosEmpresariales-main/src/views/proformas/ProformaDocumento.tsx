import { G, BRAND_HEX } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import MunicipalSeal from "@/components/common/MunicipalSeal"
import type { ProformaRecibidaDetalle } from "@/api/proformas"
import { fmtFecha } from "@/utils/fechas"

const fmtQ = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

export default function ProformaDocumento({
  detalle,
  onClose,
}: {
  detalle: ProformaRecibidaDetalle
  onClose: () => void
}) {
  const total = detalle.items.reduce((acc, it) => acc + Number(it.subtotal ?? 0), 0)

  return (
    <div
      className="fixed inset-0 z-[300] overflow-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
    >
      <div className="no-print sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: "rgba(30,94,47,0.95)" }}>
        <p className="text-white text-sm font-bold">Vista previa de Proforma</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: "#FFFFFF", color: G }}
          >
            <Icons.PDF /> Imprimir
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-white/40 text-white transition-all hover:bg-white/10"
          >
            <Icons.X /> Cerrar
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-8 flex justify-center">
        <div
          className="print-area bg-white w-full max-w-3xl rounded-lg shadow-2xl text-gray-900"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <div className="px-10 py-9">
            {/* Encabezado */}
            <div className="flex items-start justify-between gap-6 pb-5 border-b-2" style={{ borderColor: G }}>
              <div className="flex items-center gap-3">
                <MunicipalSeal size={64} />
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: G }}>
                    Municipalidad de Panajachel
                  </p>
                  <p className="text-[11px] text-gray-500">Departamento de Compras</p>
                  <p className="text-[11px] text-gray-400">Sololá, Guatemala</p>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: G }}>
                  PROFORMA
                </h1>
                <p className="text-sm font-mono font-semibold text-gray-700 mt-1">{detalle.numero_cotizacion}</p>
                <p className="text-xs text-gray-400 mt-0.5">Fecha: {fmtFecha(detalle.fecha_cotizacion)}</p>
              </div>
            </div>

            {/* Proveedor / Solicitud */}
            <div className="grid grid-cols-2 gap-6 py-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Proveedor</p>
                <p className="text-sm font-bold text-gray-900">{detalle.razon_social}</p>
                <p className="text-xs text-gray-600">NIT: {detalle.nit}</p>
                {detalle.correo && <p className="text-xs text-gray-500">{detalle.correo}</p>}
                {detalle.telefono && <p className="text-xs text-gray-500">{detalle.telefono}</p>}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Solicitud</p>
                <p className="text-sm font-bold text-gray-900 font-mono">{detalle.codigo_requisicion}</p>
                <p className="text-xs text-gray-600">{detalle.nombre_dependencia}</p>
                <p className="text-xs text-gray-500">{detalle.tipo_solicitud}</p>
                {detalle.lugar_entrega && <p className="text-xs text-gray-500">Entrega: {detalle.lugar_entrega}</p>}
              </div>
            </div>

            {/* Ítems */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y" style={{ borderColor: `${BRAND_HEX}40` }}>
                  <th className="py-2 px-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="py-2 px-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th className="py-2 px-2 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="py-2 px-2 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">P. Unitario</th>
                  <th className="py-2 px-2 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalle.items.map((it, idx) => (
                  <tr key={it.id_detalle_cotizacion} className="border-b border-gray-100">
                    <td className="py-2.5 px-2 text-gray-400 font-mono text-xs">{idx + 1}</td>
                    <td className="py-2.5 px-2">
                      <p className="text-sm font-semibold text-gray-800">{it.descripcion}</p>
                      {it.descripcion_oferta && <p className="text-xs text-gray-500">{it.descripcion_oferta}</p>}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-gray-700">
                      {Number(it.cantidad_cotizada).toLocaleString("es-GT")} {it.unidad_simbolo}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-gray-700">{fmtQ(it.precio_unitario)}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold text-gray-900">{fmtQ(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total y condiciones */}
            <div className="flex items-start justify-between gap-6 pt-5">
              <div className="space-y-1.5">
                {detalle.condiciones_pago && (
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-gray-800">Condiciones de pago:</span> {detalle.condiciones_pago}
                  </p>
                )}
                {detalle.tiempo_entrega_dias ? (
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-gray-800">Tiempo de entrega:</span> {detalle.tiempo_entrega_dias} días
                  </p>
                ) : detalle.tiempo_entrega_texto ? (
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-gray-800">Tiempo de entrega:</span> {detalle.tiempo_entrega_texto}
                  </p>
                ) : null}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-extrabold font-mono" style={{ color: G }}>
                  {fmtQ(total || detalle.monto_total)}
                </p>
              </div>
            </div>

            {/* Firmas */}
            <div className="grid grid-cols-2 gap-10 pt-16 text-center">
              <div>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs font-bold text-gray-700">Proveedor</p>
                  <p className="text-[11px] text-gray-400">{detalle.razon_social}</p>
                </div>
              </div>
              <div>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs font-bold text-gray-700">Encargado de Compras</p>
                  <p className="text-[11px] text-gray-400">Municipalidad de Panajachel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
