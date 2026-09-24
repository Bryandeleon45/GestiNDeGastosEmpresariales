import { useState, useEffect } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"

export default function NuevaOrdenModal({
  onClose,
  onToast,
}: {
  onClose: () => void
  onToast: (m: string, s: string) => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])
  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }
  const [proveedor, setProveedor] = useState("")
  const [concepto, setConcepto] = useState("")
  const [monto, setMonto] = useState("")
  const [fecha, setFecha] = useState("")
  const [tipo, setTipo] = useState<"FACTURA" | "CONTRATO" | "PLANILLA">(
    "FACTURA",
  )
  const submit = () => {
    if (!proveedor || !monto) return
    handleClose()
    setTimeout(
      () =>
        onToast(
          "Orden de pago creada",
          `Se registró la orden para ${proveedor}.`,
        ),
      300,
    )
  }
  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`,
          backdropFilter: "blur(2px)",
          transition: "background-color 0.28s",
        }}
      />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto"
          style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
        >
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: G }}
            >
              <Icons.Facturacion />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-none">
                Nueva Orden de Pago
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Registro de compromiso financiero municipal
              </p>
            </div>
            <button
              onClick={handleClose}
              className="ml-auto p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Icons.X />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(["FACTURA", "CONTRATO", "PLANILLA"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className="py-2 text-xs font-bold rounded-lg border-2 transition-all"
                  style={{
                    borderColor: tipo === t ? G : "#E5E7EB",
                    backgroundColor: tipo === t ? GL : "white",
                    color: tipo === t ? G : "#6B7280",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">
                Proveedor *
              </label>
              <input
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Nombre del proveedor"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">
                Concepto
              </label>
              <input
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Descripción del servicio o bien"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">
                  Monto (Q) *
                </label>
                <input
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  type="number"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">
                  Fecha de Vencimiento
                </label>
                <input
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  type="date"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-600 transition-colors"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{
                backgroundColor: G,
                opacity: !proveedor || !monto ? 0.5 : 1,
              }}
            >
              Crear Orden de Pago
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
