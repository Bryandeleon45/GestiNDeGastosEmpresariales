import { Icons } from "@/components/common/Icons"
import { G } from "@/constants/theme"

// Visor de PDF en el mismo sistema: modal oscuro con el documento embebido
// (blob) y opción de descarga. Reutiliza el patrón del portal de proveedores.

export default function PdfViewerModal({
  src,
  nombre,
  onClose,
}: {
  src: string | null
  nombre: string
  onClose: () => void
}) {
  const descargar = () => {
    if (!src) return
    const a = document.createElement("a")
    a.href = src
    a.download = nombre
    a.click()
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-[450] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(17,24,39,0.72)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: G }}
            >
              <Icons.PDF />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                Centro de Ayuda
              </p>
              <p className="text-xs text-gray-500 truncate">{nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={descargar}
              disabled={!src}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: G }}
            >
              Descargar
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Icons.X />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-200">
          {src ? (
            <iframe
              src={src}
              title={nombre}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm font-medium text-gray-500">
                Generando documento…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
