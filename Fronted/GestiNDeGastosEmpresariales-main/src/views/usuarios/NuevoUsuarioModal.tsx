import { useState, useEffect } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  type UsuarioRecord,
  type CatalogOption,
  type UsuarioFormData,
} from "@/models/usuarios"
import { listarRoles } from "@/api/roles"
import { listarDependencias, listarPuestos } from "@/api/catalogos"

export default function NuevoUsuarioModal({
  usuario,
  onClose,
  onSave,
}: {
  usuario: UsuarioRecord | null
  onClose: () => void
  onSave: (data: UsuarioFormData) => Promise<void>
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

  const isEdit = !!usuario

  const [roles, setRoles] = useState<CatalogOption[]>([])
  const [dependencias, setDependencias] = useState<CatalogOption[]>([])
  const [puestos, setPuestos] = useState<CatalogOption[]>([])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const rs = await listarRoles()
        if (active)
          setRoles(
            rs.map((r) => ({ id: r.id_rol, label: r.nombre_rol || r.descripcion })),
          )
      } catch {
        if (active) setRoles([])
      }
    })()
    ;(async () => {
      try {
        const ds = await listarDependencias()
        if (active)
          setDependencias(
            ds
              .filter((d) => d.activo)
              .map((d) => ({ id: d.id_dependencia, label: d.nombre_dependencia })),
          )
      } catch {
        if (active) setDependencias([])
      }
    })()
    ;(async () => {
      try {
        const ps = await listarPuestos()
        if (active)
          setPuestos(
            ps
              .filter((p) => p.activo)
              .map((p) => ({ id: p.id_puesto, label: p.descripcion })),
          )
      } catch {
        if (active) setPuestos([])
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const [pNombre, setPNombre] = useState(
    usuario
      ? (usuario.primer_nombre?.split(" ")[0] ?? usuario.nombre.split(" ")[0] ?? "")
      : "",
  )
  const [sNombre, setSNombre] = useState(
    usuario
      ? (usuario.primer_nombre?.split(" ").slice(1).join(" ") ??
        usuario.nombre.split(" ")[1] ??
        "")
      : "",
  )
  const [pApellido, setPApellido] = useState(
    usuario
      ? (usuario.apellido?.split(" ")[0] ?? usuario.nombre.split(" ")[2] ?? "")
      : "",
  )
  const [sApellido, setSApellido] = useState(
    usuario
      ? (usuario.apellido?.split(" ").slice(1).join(" ") ??
        usuario.nombre.split(" ")[3] ??
        "")
      : "",
  )
  const [dpi, setDpi] = useState(usuario?.dpi ?? "")
  const [fnac, setFnac] = useState("")
  const [telefono, setTelefono] = useState(usuario?.telefono ?? "")
  const [correo, setCorreo] = useState(usuario?.correo ?? "")
  const [depId, setDepId] = useState(
    usuario?.id_dependencia != null ? String(usuario.id_dependencia) : "",
  )
  const [puestoId, setPuestoId] = useState(
    usuario?.id_puesto != null ? String(usuario.id_puesto) : "",
  )
  const [acceso, setAcceso] = useState(usuario?.tieneAcceso ?? false)
  const [userLogin, setUserLogin] = useState(usuario?.nombre_usuario ?? "")
  const [rolId, setRolId] = useState(
    usuario?.id_rol != null ? String(usuario.id_rol) : "",
  )
  const [pass, setPass] = useState("")
  const [passConf, setPassConf] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!pNombre.trim()) e.pNombre = "Requerido"
    if (!pApellido.trim()) e.pApellido = "Requerido"
    if (!dpi.trim()) e.dpi = "Requerido"
    if (!correo.trim()) e.correo = "Requerido"
    if (acceso) {
      if (!userLogin.trim()) e.userLogin = "Requerido"
      if (!rolId) e.rol = "Requerido"
      if (!isEdit && pass.length < 8) e.pass = "Mínimo 8 caracteres"
      if (!isEdit && pass !== passConf)
        e.passConf = "Las contraseñas no coinciden"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    const nombre = [pNombre, sNombre].filter(Boolean).join(" ")
    const apellido = [pApellido, sApellido].filter(Boolean).join(" ")
    const data: UsuarioFormData = {
      nombre,
      apellido,
      dpi,
      telefono,
      correo,
      fecha_nacimiento: fnac || undefined,
      id_dependencia: depId ? Number(depId) : null,
      id_puesto: puestoId ? Number(puestoId) : null,
      acceso,
      nombre_usuario: userLogin,
      id_rol: rolId ? Number(rolId) : null,
      clave: pass,
    }
    setSaving(true)
    try {
      await onSave(data)
      handleClose()
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        general: e instanceof Error ? e.message : "No se pudo guardar",
      }))
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-colors focus:border-[#1E5E2F]"
  const labelCls = "block text-xs font-bold text-gray-600 mb-1"
  const errCls = "text-[10px] text-red-500 mt-0.5"

  return (
    <>
      <div
        className="fixed inset-0 z-[200]"
        onClick={handleClose}
        style={{
          backgroundColor: `rgba(0,0,0,${visible ? 0.5 : 0})`,
          backdropFilter: "blur(3px)",
          transition: "background-color 0.28s",
        }}
      />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto pointer-events-auto"
          style={{
            animation: visible
              ? "modalIn 0.22s cubic-bezier(.16,1,.3,1)"
              : undefined,
          }}
        >
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: GL }}
              >
                <Icons.UserPlus />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  {isEdit ? "Editar Usuario" : "Registrar Usuario"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isEdit
                    ? `Editando: ${usuario?.codigo}`
                    : "Complete los campos requeridos"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"
            >
              <Icons.X />
            </button>
          </div>

          <div className="px-7 py-6 space-y-6">
            <div>
              <p
                className="text-xs font-extrabold uppercase tracking-widest mb-4"
                style={{ color: G }}
              >
                Datos Personales
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Primer Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={pNombre}
                    onChange={(e) => setPNombre(e.target.value)}
                    placeholder="Ej. Carlos"
                    className={inputCls}
                    style={{
                      borderColor: errors.pNombre ? "#DC2626" : "#E5E7EB",
                    }}
                  />
                  {errors.pNombre && <p className={errCls}>{errors.pNombre}</p>}
                </div>
                <div>
                  <label className={labelCls}>
                    Segundo Nombre{" "}
                    <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    value={sNombre}
                    onChange={(e) => setSNombre(e.target.value)}
                    placeholder="Ej. Enrique"
                    className={inputCls}
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Primer Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={pApellido}
                    onChange={(e) => setPApellido(e.target.value)}
                    placeholder="Ej. Pérez"
                    className={inputCls}
                    style={{
                      borderColor: errors.pApellido ? "#DC2626" : "#E5E7EB",
                    }}
                  />
                  {errors.pApellido && (
                    <p className={errCls}>{errors.pApellido}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Segundo Apellido{" "}
                    <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    value={sApellido}
                    onChange={(e) => setSApellido(e.target.value)}
                    placeholder="Ej. López"
                    className={inputCls}
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    DPI <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={dpi}
                    onChange={(e) => setDpi(e.target.value)}
                    placeholder="0000 00000 0000"
                    className={inputCls}
                    style={{ borderColor: errors.dpi ? "#DC2626" : "#E5E7EB" }}
                  />
                  {errors.dpi && <p className={errCls}>{errors.dpi}</p>}
                </div>
                <div>
                  <label className={labelCls}>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={fnac}
                    onChange={(e) => setFnac(e.target.value)}
                    className={inputCls}
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Correo <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="correo@munipanajachel.gob.gt"
                    className={inputCls}
                    style={{
                      borderColor: errors.correo ? "#DC2626" : "#E5E7EB",
                    }}
                  />
                  {errors.correo && <p className={errCls}>{errors.correo}</p>}
                </div>
                <div>
                  <label className={labelCls}>Teléfono</label>
                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="5551-0000"
                    className={inputCls}
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Dependencia{" "}
                    <span className="text-gray-400">(opcional)</span>
                  </label>
                  <select
                    value={depId}
                    onChange={(e) => setDepId(e.target.value)}
                    className={inputCls + " cursor-pointer"}
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <option value="">Seleccione...</option>
                    {dependencias.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>
                    Puesto{" "}
                    <span className="text-gray-400">(opcional)</span>
                  </label>
                  <select
                    value={puestoId}
                    onChange={(e) => setPuestoId(e.target.value)}
                    className={inputCls + " cursor-pointer"}
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <option value="">Seleccione...</option>
                    {puestos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: GL, color: G }}
                  >
                    <Icons.Shield />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Acceso al Sistema
                    </p>
                    <p className="text-xs text-gray-400">
                      Habilitar credenciales de ingreso
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAcceso((v) => !v)}
                  role="switch"
                  aria-checked={acceso}
                  className="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0"
                  style={{ backgroundColor: acceso ? G : "#D1D5DB" }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300"
                    style={{
                      transform: acceso ? "translateX(24px)" : "translateX(0)",
                    }}
                  />
                </button>
              </div>
              {acceso && (
                <div className="px-5 py-5 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>
                        Usuario <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={userLogin}
                        onChange={(e) => setUserLogin(e.target.value)}
                        placeholder="usuario.sistema"
                        className={inputCls}
                        style={{
                          borderColor: errors.userLogin ? "#DC2626" : "#E5E7EB",
                        }}
                      />
                      {errors.userLogin && (
                        <p className={errCls}>{errors.userLogin}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>
                        Rol del Sistema <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={rolId}
                        onChange={(e) => setRolId(e.target.value)}
                        className={inputCls + " cursor-pointer"}
                        style={{ borderColor: "#E5E7EB" }}
                      >
                        <option value="">Seleccione...</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {!isEdit && (
                      <>
                        <div>
                          <label className={labelCls}>
                            Contraseña Temporal{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showPass ? "text" : "password"}
                              value={pass}
                              onChange={(e) => setPass(e.target.value)}
                              placeholder="Mínimo 8 caracteres"
                              className={inputCls + " pr-10"}
                              style={{
                                borderColor: errors.pass
                                  ? "#DC2626"
                                  : "#E5E7EB",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPass((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <Icons.Eye />
                            </button>
                          </div>
                          {errors.pass && (
                            <p className={errCls}>{errors.pass}</p>
                          )}
                        </div>
                        <div>
                          <label className={labelCls}>
                            Confirmar Contraseña{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type={showPass ? "text" : "password"}
                            value={passConf}
                            onChange={(e) => setPassConf(e.target.value)}
                            placeholder="Repita la contraseña"
                            className={inputCls}
                            style={{
                              borderColor: errors.passConf
                                ? "#DC2626"
                                : "#E5E7EB",
                            }}
                          />
                          {errors.passConf && (
                            <p className={errCls}>{errors.passConf}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {errors.general && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 border border-red-100">
                <Icons.Warning />
                {errors.general}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-white transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm disabled:opacity-60"
              style={{ backgroundColor: G }}
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando…
                </>
              ) : isEdit ? (
                <>
                  <Icons.CheckMark /> Actualizar Usuario
                </>
              ) : (
                <>
                  <Icons.UserPlus /> Registrar Usuario
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
