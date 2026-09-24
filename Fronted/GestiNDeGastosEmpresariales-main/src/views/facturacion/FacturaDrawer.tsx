import { useState, useEffect } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { ESTADO_STYLE, type Factura } from "@/models/facturacion"

export default function FacturaDrawer({
  factura,
  onClose,
  onToast,
}: {
  factura: Factura
  onClose: () => void
  onToast: (m: string, s: string) => void
}) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 10)
    return () => clearTimeout(t)
  }, [])
  const handleClose = () => {
    setOpen(false)
    setTimeout(onClose, 300)
  }
  const est = ESTADO_STYLE[factura.estado]
  const fmt = (n: number) =>
    `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
  return (
    <>
      <div
        className="fixed inset-0 z-[190]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${open ? 0.4 : 0})`,
          transition: "background-color 0.3s",
        }}
      />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md z-[195] bg-white shadow-2xl flex flex-col"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: G }}
          >
            <Icons.Doc />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-extrabold text-gray-900 leading-none">
              {factura.num}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {factura.proveedor}
            </p>
          </div>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: est.bg, color: est.color }}
          >
            {factura.estado}
          </span>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all ml-1"
          >
            <Icons.X />
          </button>
        </div>
        <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center py-10 gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: GL }}
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke={G}
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-700">
                Comprobante {factura.xml}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Factura Electrónica en Línea (FEL)
              </p>
            </div>
            <button
              onClick={() =>
                onToast(
                  "Descargando comprobante",
                  `${factura.xml}.pdf se descargará en un momento.`,
                )
              }
              className="px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all hover:opacity-90"
              style={{ backgroundColor: GL, color: G }}
            >
              <Icons.PDF /> Descargar PDF
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "N.° Factura", value: factura.num },
              { label: "NIT Proveedor", value: factura.nit },
              { label: "Fecha Emisión", value: factura.fecha },
              { label: "Monto Total", value: fmt(factura.monto), accent: true },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {f.label}
                </p>
                <p
                  className={`text-sm font-bold mt-1 ${
                    f.accent ? "" : "text-gray-900"
                  }`}
                  style={f.accent ? { color: G } : {}}
                >
                  {f.value}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Concepto
            </p>
            <p className="text-sm text-gray-800 mt-1">{factura.concepto}</p>
          </div>
          {factura.estado !== "PAGADO" && (
            <div className="space-y-2.5">
              {factura.estado === "VENCIDO" && (
                <div
                  className="flex items-start gap-2.5 rounded-xl px-4 py-3 border"
                  style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}
                >
                  <svg
                    className="w-4 h-4 mt-0.5 shrink-0 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p className="text-xs text-red-700 font-medium leading-relaxed">
                    Esta factura ha vencido. Se requiere aprobación del Director
                    Administrativo para procesarla.
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  onToast(
                    "Pago aprobado",
                    `${factura.num} marcada para procesarse.`,
                  )
                  handleClose()
                }}
                className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: G }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Aprobar y Procesar Pago
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
