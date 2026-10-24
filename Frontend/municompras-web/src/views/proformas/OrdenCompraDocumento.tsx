import { G, BRAND_HEX } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import MunicipalSeal from "@/components/common/MunicipalSeal"
import type { OrdenCompraDetalle } from "@/api/proformas"
import { fmtFecha } from "@/utils/fechas"

const fmtQ = (n: number | string) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

const ESTADO_LABEL: Record<string, string> = {
  Pendiente: "PENDIENTE",
  Aprobada: "APROBADA",
  Enviada: "ENVIADA",
  Entregada: "ENTREGADA",
  Cancelada: "CANCELADA",
}

export default function OrdenCompraDocumento({
  orden,
  onClose,
}: {
  orden: OrdenCompraDetalle
  onClose: () => void
}) {
  const total = orden.items.reduce((acc, it) => acc + Number(it.subtotal ?? 0), 0)

  return (
    <div
      className="fixed inset-0 z-[300] overflow-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
    >
      <div className="no-print sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: "rgba(30,94,47,0.95)" }}>
        <p className="text-white text-sm font-bold">Vista previa de Orden de Compra</p>
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
                <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: G }}>
                  ORDEN DE COMPRA
                </h1>
                <p className="text-sm font-mono font-semibold text-gray-700 mt-1">{orden.numero_orden}</p>
                <p className="text-xs text-gray-400 mt-0.5">Fecha: {fmtFecha(orden.fecha_emision)}</p>
              </div>
            </div>

            {/* Proveedor / Solicitud */}
            <div className="grid grid-cols-2 gap-6 py-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Proveedor</p>
                <p className="text-sm font-bold text-gray-900">{orden.razon_social}</p>
                <p className="text-xs text-gray-600">NIT: {orden.nit}</p>
                {orden.correo && <p className="text-xs text-gray-500">{orden.correo}</p>}
                {orden.telefono && <p className="text-xs text-gray-500">{orden.telefono}</p>}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Solicitud</p>
                <p className="text-sm font-bold text-gray-900 font-mono">{orden.codigo_requisicion}</p>
                <p className="text-xs text-gray-600">{orden.nombre_dependencia}</p>
                <p className="text-xs text-gray-500">{orden.tipo_solicitud}</p>
                {orden.lugar_entrega && <p className="text-xs text-gray-500">Entrega: {orden.lugar_entrega}</p>}
                {orden.fecha_entrega_estimada && (
                  <p className="text-xs text-gray-500">Entrega estimada: {fmtFecha(orden.fecha_entrega_estimada)}</p>
                )}
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
                {orden.items.map((it, idx) => (
                  <tr key={it.id_detalle_orden} className="border-b border-gray-100">
                    <td className="py-2.5 px-2 text-gray-400 font-mono text-xs">{idx + 1}</td>
                    <td className="py-2.5 px-2">
                      <p className="text-sm font-semibold text-gray-800">{it.descripcion}</p>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-gray-700">
                      {Number(it.cantidad_comprada).toLocaleString("es-GT")} {it.unidad_simbolo}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-gray-700">{fmtQ(it.precio_unitario)}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold text-gray-900">{fmtQ(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total y estado */}
            <div className="flex items-end justify-between gap-6 pt-5">
              <div className="space-y-1.5">
                <p className="text-xs text-gray-600">
                  <span className="font-bold text-gray-800">Estado:</span>{" "}
                  {ESTADO_LABEL[orden.estado] ?? orden.estado}
                </p>
                {orden.justificacion && (
                  <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                    <span className="font-bold text-gray-800">Justificación:</span> {orden.justificacion}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-extrabold font-mono" style={{ color: G }}>
                  {fmtQ(total || orden.monto_total)}
                </p>
              </div>
            </div>

            {/* Firmas */}
            <div className="grid grid-cols-2 gap-10 pt-16 text-center">
              <div>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs font-bold text-gray-700">Encargado de Compras</p>
                  <p className="text-[11px] text-gray-400">Municipalidad de Panajachel</p>
                </div>
              </div>
              <div>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs font-bold text-gray-700">Proveedor</p>
                  <p className="text-[11px] text-gray-400">{orden.razon_social}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
