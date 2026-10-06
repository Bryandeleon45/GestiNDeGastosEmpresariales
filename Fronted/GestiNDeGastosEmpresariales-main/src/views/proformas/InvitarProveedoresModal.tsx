import { useEffect, useState } from "react"
import { G } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  obtenerProceso,
  listarProveedoresActivos,
  actualizarInvitaciones,
  type ProveedorActivo,
} from "@/api/proformas"
import { ApiError } from "@/api/client"

export default function InvitarProveedoresModal({
  idProceso,
  onClose,
  onSuccess,
  onToast,
}: {
  idProceso: number
  onClose: () => void
  onSuccess: () => void
  onToast: (m: string, s: string) => void
}) {
  const [proveedores, setProveedores] = useState<ProveedorActivo[]>([])
  const [sel, setSel] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([obtenerProceso(idProceso), listarProveedoresActivos()])
      .then(([proceso, provs]) => {
        setProveedores(provs)
        setSel(proceso.invitados.map((i) => i.id_proveedor))
      })
      .catch(() => onToast("Error", "No se pudieron cargar los proveedores"))
      .finally(() => setLoading(false))
  }, [idProceso, onToast])

  const toggle = (id: number) => {
    setSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const guardar = async () => {
    setSubmitting(true)
    try {
      await actualizarInvitaciones(idProceso, sel)
      onToast("Invitaciones actualizadas", "Los proveedores seleccionados fueron invitados a ofertar.")
      onSuccess()
    } catch (e) {
      onToast("Error", e instanceof ApiError ? e.message : "No se pudieron actualizar las invitaciones")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.52)", backdropFilter: "blur(1px)" }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col"
        style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: G }}
            >
              <Icons.UserPlus />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Invitar a Ofertar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            <Icons.X />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-10">Cargando proveedores…</p>
          ) : proveedores.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No hay proveedores activos.</p>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                Seleccione los proveedores que recibirán la invitación a cotizar (
                <b className="text-gray-700">{sel.length}</b> seleccionados).
              </p>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 overflow-hidden">
                {proveedores.map((p) => {
                  const checked = sel.includes(p.id_proveedor)
                  return (
                    <label
                      key={p.id_proveedor}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(p.id_proveedor)}
                        className="w-4 h-4 accent-[#1E5E2F]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.razon_social}</p>
                        <p className="text-[11px] text-gray-400">
                          {p.nit}
                          {p.correo ? ` · ${p.correo}` : ""}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
            style={{ backgroundColor: G }}
          >
            <Icons.Send />
            {submitting ? "Guardando…" : "Invitar"}
          </button>
        </div>
      </div>
    </div>
  )
}
