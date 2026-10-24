import { useState, useEffect } from "react"

export default function CerrarSesionModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: () => void
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
  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.55 : 0})`,
          backdropFilter: "blur(3px)",
          transition: "background-color 0.28s",
        }}
      />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto text-center"
          style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
        >
          <div className="px-6 pt-8 pb-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-red-50">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 leading-snug">
              ¿Desea cerrar la sesión activa?
            </h2>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              Está a punto de salir del Sistema de Gestión Municipal de
              Panajachel. Guarde sus cambios antes de continuar.
            </p>
          </div>
          <div className="flex gap-3 px-6 py-6">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setVisible(false)
                setTimeout(onConfirm, 280)
              }}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: "#DC2626" }}
            >
              Confirmar y Salir
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
