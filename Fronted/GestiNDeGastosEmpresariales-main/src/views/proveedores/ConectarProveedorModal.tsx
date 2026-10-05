import { useState, useEffect } from "react"
import { G, GL, GB } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import Dropdown from "@/views/common/Dropdown"
import { conectarProveedor, type TipoProveedor, type RolPortal } from "@/api/proveedores"
import { ApiError } from "@/api/client"

export default function ConectarProveedorModal({
  onClose,
  onSuccess,
  onToast,
  tipos,
  rolesPortal,
}: {
  onClose: () => void
  onSuccess: () => void
  onToast: (m: string, s: string) => void
  tipos: TipoProveedor[]
  rolesPortal: RolPortal[]
}) {
  const [nombre, setNombre] = useState("")
  const [nit, setNit] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [rol, setRol] = useState(rolesPortal[0]?.descripcion ?? "")
  const [categoria, setCategoria] = useState(tipos[0]?.descripcion ?? "")
  const [visible, setVisible] = useState(false)
  const [focusField, setFocus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const fi = (id: string) => ({
    onFocus: () => setFocus(id),
    onBlur: () => setFocus(null),
    style: {
      borderColor: focusField === id ? G : "#E5E7EB",
      boxShadow: focusField === id ? `0 0 0 3px ${G}20` : "none",
      outline: "none",
      transition: "all 0.15s",
    } as React.CSSProperties,
  })

  const enviar = async () => {
    if (!nombre.trim() || !nit.trim() || !email.trim() || !rol || !categoria) {
      onToast("Revisar formulario", "Complete todos los campos obligatorios.")
      return
    }
    const idRol = rolesPortal.find((r) => r.descripcion === rol)?.id_rol
    const idTipo = tipos.find((t) => t.descripcion === categoria)?.id_tipo_proveedor
    if (!idRol || !idTipo) {
      onToast("Revisar formulario", "Seleccione un rol y una categoría válidos.")
      return
    }
    setSubmitting(true)
    try {
      const res = await conectarProveedor({
        razon_social: nombre.trim(),
        nit: nit.trim(),
        correo: email.trim(),
        telefono: telefono.trim() || undefined,
        id_rol: idRol,
        id_tipo_proveedor: idTipo,
      })
      onToast(
        "Proveedor conectado",
        `Usuario: ${res.credenciales.nombre_usuario} · Clave temporal: ${res.credenciales.clave_temporal}`,
      )
      onSuccess()
    } catch (e) {
      onToast(
        "Error",
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "No se pudo conectar",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const campos = [
    { label: "Nombre del Proveedor", id: "nombre", val: nombre, set: setNombre, ph: "Ej. Suministros El Lago" },
    { label: "NIT", id: "nit", val: nit, set: setNit, ph: "Ej. 459823-1" },
    { label: "Correo Electrónico", id: "email", val: email, set: setEmail, ph: "contacto@proveedor.gt" },
    { label: "Teléfono", id: "tel", val: telefono, set: setTelefono, ph: "7762-0000" },
  ]

  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`,
          backdropFilter: "blur(1.5px)",
          transition: "background-color 0.28s",
        }}
      />
      <div
        className="fixed right-0 top-0 bottom-0 z-[210] flex flex-col bg-white shadow-2xl"
        style={{
          width: 460,
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: G }}
            >
              <Icons.UserPlus />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-none">
                Conectar Nuevo Proveedor
              </h2>
              <p
                className="text-[11px] font-semibold mt-0.5 uppercase tracking-wider"
                style={{ color: G }}
              >
                Portal Municipal
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            <Icons.X />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {campos.map((f) => (
            <div key={f.id}>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                {f.label}
              </label>
              <input
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.ph}
                className="w-full px-3 py-2.5 text-sm bg-white border rounded-lg placeholder-gray-400"
                {...fi(f.id)}
              />
            </div>
          ))}

          <Dropdown
            label="Rol Asignado"
            value={rol}
            options={rolesPortal.map((r) => r.descripcion)}
            onChange={setRol}
          />
          <Dropdown
            label="Categoría"
            value={categoria}
            options={tipos.map((t) => t.descripcion)}
            onChange={setCategoria}
          />

          <div
            className="flex items-start gap-2.5 rounded-xl px-4 py-3 border"
            style={{ backgroundColor: GL, borderColor: GB }}
          >
            <span style={{ color: G }} className="mt-0.5 shrink-0">
              <Icons.Info />
            </span>
            <p className="text-xs text-gray-700 leading-relaxed">
              Se creará la cuenta del proveedor con una clave temporal, que se
              mostrará al confirmar para que pueda entregársela de forma segura.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={enviar}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-lg transition-all hover:opacity-90 shadow-sm disabled:opacity-50"
            style={{ backgroundColor: G }}
          >
            <Icons.UserPlus />
            {submitting ? "Conectando…" : "Conectar Proveedor"}
          </button>
        </div>
      </div>
    </>
  )
}
