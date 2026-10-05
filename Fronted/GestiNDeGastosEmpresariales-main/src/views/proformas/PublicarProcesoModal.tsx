import { useEffect, useRef, useState } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  listarRequisicionesAprobadas,
  listarProveedoresActivos,
  publicarProceso,
  type RequisicionAprobada,
  type ProveedorActivo,
} from "@/api/proformas"
import { ApiError } from "@/api/client"

export default function PublicarProcesoModal({
  onClose,
  onSuccess,
  onToast,
}: {
  onClose: () => void
  onSuccess: () => void
  onToast: (m: string, s: string) => void
}) {
  const [requisiciones, setRequisiciones] = useState<RequisicionAprobada[]>([])
  const [proveedores, setProveedores] = useState<ProveedorActivo[]>([])
  const [idRequisicion, setIdRequisicion] = useState<number | null>(null)
  const [fechaLimite, setFechaLimite] = useState("")
  const [minOfertas, setMinOfertas] = useState(3)
  const [selProveedores, setSelProveedores] = useState<number[]>([])
  const [reqOpen, setReqOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const reqRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listarRequisicionesAprobadas()
      .then(setRequisiciones)
      .catch(() => onToast("Error", "No se pudieron cargar las solicitudes aprobadas"))
    listarProveedoresActivos()
      .then(setProveedores)
      .catch(() => onToast("Error", "No se pudieron cargar los proveedores"))
  }, [onToast])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (reqRef.current && !reqRef.current.contains(e.target as Node)) setReqOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const reqSel = requisiciones.find((r) => r.id_requisicion === idRequisicion) ?? null

  const toggleProveedor = (id: number) => {
    setSelProveedores((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const publicar = async () => {
    if (idRequisicion == null) {
      onToast("Revisar formulario", "Seleccione la solicitud")
      return
    }
    if (!fechaLimite) {
      onToast("Revisar formulario", "La fecha límite es obligatoria")
      return
    }
    setSubmitting(true)
    try {
      await publicarProceso({
        id_requisicion: idRequisicion,
        fecha_limite: new Date(fechaLimite).toISOString(),
        min_ofertas: minOfertas,
        proveedores: selProveedores,
      })
      onToast("Proceso publicado", "La solicitud pasó a En Compra y los proveedores fueron invitados.")
      onSuccess()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudo publicar el proceso")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.52)", backdropFilter: "blur(1px)" }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: G }}
            >
              <Icons.Proformas />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Publicar Proceso de Cotización</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            <Icons.X />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Solicitud Aprobada
            </label>
            <div ref={reqRef} className="relative">
              <button
                type="button"
                onClick={() => setReqOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-white border rounded-lg transition-all text-left"
                style={{ borderColor: reqOpen ? G : "#D1D5DB" }}
              >
                <span className={`font-medium ${reqSel ? "text-gray-800" : "text-gray-400"}`}>
                  {reqSel ? `${reqSel.codigo_requisicion} · ${reqSel.nombre_dependencia}` : "Seleccione una solicitud…"}
                </span>
                <span className="text-gray-400 ml-2 shrink-0">
                  {reqOpen ? <Icons.ChevUp /> : <Icons.ChevDown />}
                </span>
              </button>
              {reqOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[300] overflow-hidden max-h-56 overflow-y-auto"
                  style={{ animation: "dropIn 0.13s ease-out" }}
                >
                  {requisiciones.length === 0 && (
                    <p className="px-3 py-2.5 text-sm text-gray-400">
                      No hay solicitudes aprobadas pendientes de cotizar.
                    </p>
                  )}
                  {requisiciones.map((r) => (
                    <button
                      type="button"
                      key={r.id_requisicion}
                      onClick={() => {
                        setIdRequisicion(r.id_requisicion)
                        setReqOpen(false)
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors"
                      style={{ backgroundColor: r.id_requisicion === idRequisicion ? GL : undefined }}
                    >
                      <p className="text-sm font-medium text-gray-800">{r.codigo_requisicion}</p>
                      <p className="text-[11px] text-gray-400">
                        {r.nombre_dependencia} · {r.tipo_solicitud}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Fecha Límite
              </label>
              <input
                type="datetime-local"
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Mínimo de Ofertas
              </label>
              <input
                type="number"
                min={1}
                value={minOfertas}
                onChange={(e) => setMinOfertas(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600"
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Proveedores a Invitar ({selProveedores.length})
            </p>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-56 overflow-y-auto">
              {proveedores.length === 0 && (
                <p className="px-3 py-3 text-sm text-gray-400">Sin proveedores activos.</p>
              )}
              {proveedores.map((p) => {
                const checked = selProveedores.includes(p.id_proveedor)
                return (
                  <label
                    key={p.id_proveedor}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProveedor(p.id_proveedor)}
                      className="w-4 h-4 accent-[#1E5E2F]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.razon_social}</p>
                      <p className="text-[11px] text-gray-400">{p.nit}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={publicar}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
            style={{ backgroundColor: G }}
          >
            <Icons.Plus />
            {submitting ? "Publicando…" : "Publicar Proceso"}
          </button>
        </div>
      </div>
    </div>
  )
}
