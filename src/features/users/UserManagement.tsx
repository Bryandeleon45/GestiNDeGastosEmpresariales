import { useState, useEffect } from "react";
import { G, GL } from "@/constants/theme";
import { Icons } from "@/components/common/Icons";

// ─── Usuarios Data ────────────────────────────────────────────────────────────
export type UserEstado = "Activo" | "Inactivo";

export interface UsuarioRecord {
  id: string; codigo: string; nombre: string; dpi: string;
  estado: UserEstado; telefono: string;
  ingreso: string; tieneAcceso: boolean;
}

export const ROLES_SISTEMA = ["Administrador","Proveedor"];

export const USUARIOS_INIT: UsuarioRecord[] = [
  { id:"u1", codigo:"USR-001", nombre:"Carlos Enrique Pérez López",      dpi:"2891456302101", estado:"Activo",   telefono:"5551-0201", ingreso:"12/03/2018", tieneAcceso:true  },
  { id:"u2", codigo:"USR-002", nombre:"Ana Lucía Ramírez García",        dpi:"3012589740301", estado:"Activo",   telefono:"5551-0302", ingreso:"07/06/2019", tieneAcceso:true  },
  { id:"u3", codigo:"USR-003", nombre:"Jorge Alberto Morales Soto",      dpi:"2741236501801", estado:"Activo",   telefono:"5551-0403", ingreso:"15/01/2020", tieneAcceso:false },
  { id:"u4", codigo:"USR-004", nombre:"María del Carmen Ajú Batz",       dpi:"3145678920501", estado:"Activo",   telefono:"5551-0504", ingreso:"20/08/2021", tieneAcceso:true  },
  { id:"u5", codigo:"USR-005", nombre:"Roberto Josué Cojolón Tzul",      dpi:"2989741236001", estado:"Inactivo", telefono:"5551-0605", ingreso:"03/11/2017", tieneAcceso:false },
  { id:"u6", codigo:"USR-006", nombre:"Silvia Esperanza Cholotío Giron", dpi:"3056123478901", estado:"Activo",   telefono:"5551-0706", ingreso:"18/04/2022", tieneAcceso:false },
  { id:"u7", codigo:"USR-007", nombre:"Luis Fernando Tzep Chumil",       dpi:"2812345690201", estado:"Activo",   telefono:"5551-0807", ingreso:"09/09/2020", tieneAcceso:true  },
  { id:"u8", codigo:"USR-008", nombre:"Diana Patricia Ajanel Quiej",     dpi:"3201478965401", estado:"Inactivo", telefono:"5551-0908", ingreso:"25/02/2016", tieneAcceso:false },
];

export const USER_ESTADO_STYLE: Record<UserEstado, { bg: string; color: string }> = {
  Activo:   { bg: "#DCFCE7", color: "#16A34A" },
  Inactivo: { bg: "#FEE2E2", color: "#DC2626" },
};

// ─── NuevoUsuarioModal ────────────────────────────────────────────────────────
export function NuevoUsuarioModal({
  usuario, onClose, onSave,
}: { usuario: UsuarioRecord | null; onClose: () => void; onSave: (u: UsuarioRecord) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };

  const isEdit = !!usuario;
  const [pNombre,   setPNombre]   = useState(usuario ? usuario.nombre.split(" ")[0] : "");
  const [sNombre,   setSNombre]   = useState(usuario ? usuario.nombre.split(" ")[1] ?? "" : "");
  const [pApellido, setPApellido] = useState(usuario ? usuario.nombre.split(" ")[2] ?? "" : "");
  const [sApellido, setSApellido] = useState(usuario ? usuario.nombre.split(" ")[3] ?? "" : "");
  const [dpi,       setDpi]       = useState(usuario?.dpi ?? "");
  const [fnac,      setFnac]      = useState("");
  const [acceso,    setAcceso]    = useState(usuario?.tieneAcceso ?? false);
  const [userLogin, setUserLogin] = useState("");
  const [rol,       setRol]       = useState("Operador");
  const [pass,      setPass]      = useState("");
  const [passConf,  setPassConf]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [errors,    setErrors]    = useState<Record<string,string>>({});

  const validate = () => {
    const e: Record<string,string> = {};
    if (!pNombre.trim())   e.pNombre   = "Requerido";
    if (!pApellido.trim()) e.pApellido = "Requerido";
    if (!dpi.trim())       e.dpi       = "Requerido";
    if (acceso) {
      if (!userLogin.trim()) e.userLogin = "Requerido";
      if (!isEdit && pass.length < 8) e.pass = "Mínimo 8 caracteres";
      if (!isEdit && pass !== passConf) e.passConf = "Las contraseñas no coinciden";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const nombre = [pNombre, sNombre, pApellido, sApellido].filter(Boolean).join(" ");
    const rec: UsuarioRecord = {
      id:     usuario?.id      ?? `u${Date.now()}`,
      codigo: usuario?.codigo  ?? `USR-${String(Math.floor(Math.random()*900)+100)}`,
      nombre, dpi,
      estado:      usuario?.estado      ?? "Activo",
      telefono:    usuario?.telefono    ?? "",
      ingreso:     usuario?.ingreso     ?? new Date().toLocaleDateString("es-GT"),
      tieneAcceso: acceso,
    };
    onSave(rec);
    handleClose();
  };

  const inputCls = "w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-colors focus:border-[#1E5E2F]";
  const labelCls = "block text-xs font-bold text-gray-600 mb-1";
  const errCls   = "text-[10px] text-red-500 mt-0.5";

  return (
    <>
      <div className="fixed inset-0 z-[200]" onClick={handleClose}
        style={{ backgroundColor:`rgba(0,0,0,${visible?0.5:0})`, backdropFilter:"blur(3px)", transition:"background-color 0.28s" }}/>
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto pointer-events-auto"
          style={{ animation: visible ? "modalIn 0.22s cubic-bezier(.16,1,.3,1)" : undefined }}>

          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor:GL }}>
                <Icons.UserPlus/>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">{isEdit ? "Editar Usuario" : "Registrar Usuario"}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{isEdit ? `Editando: ${usuario?.codigo}` : "Complete los campos requeridos"}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400"><Icons.X/></button>
          </div>

          <div className="px-7 py-6 space-y-6">
            {/* Datos personales */}
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color:G }}>Datos Personales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Primer Nombre <span className="text-red-500">*</span></label>
                  <input value={pNombre} onChange={e=>setPNombre(e.target.value)} placeholder="Ej. Carlos" className={inputCls} style={{ borderColor:errors.pNombre?"#DC2626":"#E5E7EB" }}/>
                  {errors.pNombre && <p className={errCls}>{errors.pNombre}</p>}
                </div>
                <div>
                  <label className={labelCls}>Segundo Nombre <span className="text-gray-400">(opcional)</span></label>
                  <input value={sNombre} onChange={e=>setSNombre(e.target.value)} placeholder="Ej. Enrique" className={inputCls} style={{ borderColor:"#E5E7EB" }}/>
                </div>
                <div>
                  <label className={labelCls}>Primer Apellido <span className="text-red-500">*</span></label>
                  <input value={pApellido} onChange={e=>setPApellido(e.target.value)} placeholder="Ej. Pérez" className={inputCls} style={{ borderColor:errors.pApellido?"#DC2626":"#E5E7EB" }}/>
                  {errors.pApellido && <p className={errCls}>{errors.pApellido}</p>}
                </div>
                <div>
                  <label className={labelCls}>Segundo Apellido <span className="text-gray-400">(opcional)</span></label>
                  <input value={sApellido} onChange={e=>setSApellido(e.target.value)} placeholder="Ej. López" className={inputCls} style={{ borderColor:"#E5E7EB" }}/>
                </div>
                <div>
                  <label className={labelCls}>DPI <span className="text-red-500">*</span></label>
                  <input value={dpi} onChange={e=>setDpi(e.target.value)} placeholder="0000 00000 0000" className={inputCls} style={{ borderColor:errors.dpi?"#DC2626":"#E5E7EB" }}/>
                  {errors.dpi && <p className={errCls}>{errors.dpi}</p>}
                </div>
                <div>
                  <label className={labelCls}>Fecha de Nacimiento</label>
                  <input type="date" value={fnac} onChange={e=>setFnac(e.target.value)} className={inputCls} style={{ borderColor:"#E5E7EB" }}/>
                </div>
              </div>
            </div>

            {/* Acceso al sistema */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor:GL, color:G }}>
                    <Icons.Shield/>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Acceso al Sistema</p>
                    <p className="text-xs text-gray-400">Habilitar credenciales de ingreso</p>
                  </div>
                </div>
                <button onClick={() => setAcceso(v=>!v)} role="switch" aria-checked={acceso}
                  className="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0"
                  style={{ backgroundColor: acceso ? G : "#D1D5DB" }}>
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300"
                    style={{ transform: acceso ? "translateX(24px)" : "translateX(0)" }}/>
                </button>
              </div>
              {acceso && (
                <div className="px-5 py-5 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Usuario <span className="text-red-500">*</span></label>
                      <input value={userLogin} onChange={e=>setUserLogin(e.target.value)} placeholder="usuario.sistema" className={inputCls} style={{ borderColor:errors.userLogin?"#DC2626":"#E5E7EB" }}/>
                      {errors.userLogin && <p className={errCls}>{errors.userLogin}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Rol del Sistema <span className="text-red-500">*</span></label>
                      <select value={rol} onChange={e=>setRol(e.target.value)} className={inputCls+" cursor-pointer"} style={{ borderColor:"#E5E7EB" }}>
                        {ROLES_SISTEMA.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    {!isEdit && <>
                      <div>
                        <label className={labelCls}>Contraseña Temporal <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)}
                            placeholder="Mínimo 8 caracteres" className={inputCls+" pr-10"} style={{ borderColor:errors.pass?"#DC2626":"#E5E7EB" }}/>
                          <button type="button" onClick={() => setShowPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <Icons.Eye/>
                          </button>
                        </div>
                        {errors.pass && <p className={errCls}>{errors.pass}</p>}
                      </div>
                      <div>
                        <label className={labelCls}>Confirmar Contraseña <span className="text-red-500">*</span></label>
                        <input type={showPass?"text":"password"} value={passConf} onChange={e=>setPassConf(e.target.value)}
                          placeholder="Repita la contraseña" className={inputCls} style={{ borderColor:errors.passConf?"#DC2626":"#E5E7EB" }}/>
                        {errors.passConf && <p className={errCls}>{errors.passConf}</p>}
                      </div>
                    </>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-gray-100 bg-gray-50">
            <button onClick={handleClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-white transition-all">
              Cancelar
            </button>
            <button onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor:G }}>
              {isEdit ? <><Icons.CheckMark/> Actualizar Usuario</> : <><Icons.UserPlus/> Registrar Usuario</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Usuarios View ────────────────────────────────────────────────────────────
export default function UsuariosView({ onToast }: { onToast: (m: string, s: string) => void }) {
  const [usuarios,  setUsuarios]  = useState<UsuarioRecord[]>(USUARIOS_INIT);
  const [search,    setSearch]    = useState("");
  const [filterEst, setFilterEst] = useState("todos");
  const [page,      setPage]      = useState(1);
  const [modalUser, setModalUser] = useState<UsuarioRecord | null | undefined>(undefined);
  const PAGE_SIZE = 6;

  const filtered = usuarios.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.nombre.toLowerCase().includes(q) || u.codigo.toLowerCase().includes(q) || u.dpi.includes(q);
    const matchE = filterEst === "todos" || u.estado === filterEst;
    return matchQ && matchE;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => { setSearch(""); setFilterEst("todos"); setPage(1); };

  const handleSave = (u: UsuarioRecord) => {
    setUsuarios(prev => prev.some(p => p.id === u.id) ? prev.map(p => p.id===u.id?u:p) : [...prev, u]);
    onToast(modalUser ? "Usuario actualizado" : "Usuario registrado", u.nombre);
    setPage(1);
  };

  const toggleEstado = (id: string) => {
    setUsuarios(prev => prev.map(u => u.id===id ? {...u, estado: u.estado==="Activo"?"Inactivo":"Activo"} : u));
    const u = usuarios.find(u=>u.id===id)!;
    onToast(`Usuario ${u.estado==="Activo"?"desactivado":"activado"}`, u.nombre);
  };

  const totActivos   = usuarios.filter(u=>u.estado==="Activo").length;
  const totInactivos = usuarios.filter(u=>u.estado==="Inactivo").length;
  const totAcceso    = usuarios.filter(u=>u.tieneAcceso).length;

  return (
    <div className="flex-1 overflow-auto p-5" style={{ background:"var(--muni-bg)" }}>
      <div className="space-y-5 max-w-full">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold leading-tight" style={{ color:"var(--muni-text)" }}>Usuarios</h1>
            <p className="text-sm mt-1" style={{ color:"var(--muni-sub)" }}>Gestión de personal administrativo con acceso al sistema</p>
          </div>
          <button onClick={() => setModalUser(null)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 active:scale-95 shrink-0"
            style={{ backgroundColor:G }}>
            <Icons.UserPlus/> Nuevo Usuario
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:"TOTAL USUARIOS",    value:usuarios.length, sub:"Personal registrado",    color:G,          icon:<Icons.Users/>      },
            { label:"ACTIVOS",           value:totActivos,      sub:`${Math.round(totActivos/usuarios.length*100)}% del total`, color:"#16A34A", icon:<Icons.UserCheck/> },
            { label:"INACTIVOS",         value:totInactivos,    sub:"Fuera de servicio",      color:"#DC2626",  icon:<Icons.UserX/>     },
            { label:"CON ACCESO",        value:totAcceso,       sub:"Al sistema digital",     color:"#2563EB",  icon:<Icons.Shield/>     },
          ].map(k => (
            <div key={k.label} className="rounded-xl border p-5 shadow-sm" style={{ backgroundColor:"var(--muni-surface)", borderColor:"var(--muni-border)" }}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest leading-tight" style={{ color:"var(--muni-sub)" }}>{k.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor:`${k.color}18`, color:k.color }}>{k.icon}</div>
              </div>
              <p className="text-4xl font-extrabold font-mono leading-none" style={{ color:k.color }}>{k.value}</p>
              <p className="text-xs mt-2" style={{ color:"var(--muni-sub)" }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Filter toolbar */}
        <div className="rounded-xl border p-4 flex flex-wrap items-center gap-3" style={{ backgroundColor:"var(--muni-surface)", borderColor:"var(--muni-border)" }}>
          {/* Search */}
          <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm"
            style={{ backgroundColor:"var(--muni-bg)", borderColor:"var(--muni-border)" }}>
            <Icons.Search/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
              placeholder="Buscar por nombre, código o DPI..." className="bg-transparent outline-none flex-1 min-w-0 text-sm"
              style={{ color:"var(--muni-text)" }}/>
            {search && <button onClick={()=>setSearch("")} className="shrink-0 opacity-50 hover:opacity-100" style={{ color:"var(--muni-sub)" }}><Icons.X/></button>}
          </div>
          {/* Estado filter */}
          <select value={filterEst} onChange={e=>{setFilterEst(e.target.value);setPage(1);}}
            className="px-3 py-2.5 text-sm rounded-xl border outline-none cursor-pointer"
            style={{ backgroundColor:"var(--muni-bg)", borderColor:"var(--muni-border)", color:"var(--muni-text)" }}>
            <option value="todos">Todos los Estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          <button onClick={clearFilters}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all hover:opacity-80"
            style={{ color:"var(--muni-sub)", borderColor:"var(--muni-border)" }}>
            Limpiar filtros
          </button>
        </div>

        {/* Table card */}
        <div className="rounded-xl border overflow-hidden shadow-sm" style={{ backgroundColor:"var(--muni-surface)", borderColor:"var(--muni-border)" }}>
          {/* Table header */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b" style={{ borderColor:"var(--muni-border)", backgroundColor:"var(--muni-surface2)" }}>
                  {["CÓDIGO","NOMBRE COMPLETO","DPI","ESTADO","TELÉFONO","INGRESO","ACCIONES"].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap" style={{ color:"var(--muni-sub)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color:"var(--muni-sub)" }}>No se encontraron usuarios con los filtros aplicados.</td></tr>
                ) : paginated.map(u => {
                  const es = USER_ESTADO_STYLE[u.estado];
                  return (
                    <tr key={u.id} className="border-b last:border-b-0 transition-colors"
                      style={{ borderColor:"var(--muni-border)" }}
                      onMouseEnter={e=>(e.currentTarget.style.backgroundColor="var(--muni-surface2)")}
                      onMouseLeave={e=>(e.currentTarget.style.backgroundColor="")}>
                      <td className="px-4 py-3"><span className="text-xs font-extrabold font-mono" style={{ color:G }}>{u.codigo}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                            style={{ backgroundColor:G }}>{u.nombre[0]}</div>
                          <p className="text-sm font-semibold whitespace-nowrap" style={{ color:"var(--muni-text)" }}>{u.nombre}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color:"var(--muni-sub)" }}>{u.dpi}</span></td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor:es.bg, color:es.color }}>{u.estado}</span>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color:"var(--muni-sub)" }}>{u.telefono || "—"}</span></td>
                      <td className="px-4 py-3"><span className="text-xs" style={{ color:"var(--muni-sub)" }}>{u.ingreso}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setModalUser(u)} title="Editar"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                            style={{ backgroundColor:GL, color:G }}>
                            <Icons.Pencil/>
                          </button>
                          <button onClick={() => onToast("Perfil de usuario", u.nombre)} title="Ver perfil"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                            style={{ backgroundColor:"#EFF6FF", color:"#2563EB" }}>
                            <Icons.Eye/>
                          </button>
                          <button onClick={() => toggleEstado(u.id)} title={u.estado==="Activo"?"Desactivar":"Activar"}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                            style={{ backgroundColor: u.estado==="Activo" ? "#FEF2F2" : "#F0FDF4", color: u.estado==="Activo" ? "#DC2626" : "#16A34A" }}>
                            {u.estado==="Activo" ? <Icons.UserX/> : <Icons.UserCheck/>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y" style={{ borderColor:"var(--muni-border)" }}>
            {paginated.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm" style={{ color:"var(--muni-sub)" }}>No se encontraron usuarios.</p>
            ) : paginated.map(u => {
              const es = USER_ESTADO_STYLE[u.estado];
              return (
                <div key={u.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ backgroundColor:G }}>{u.nombre[0]}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color:"var(--muni-text)" }}>{u.nombre}</p>
                        <p className="text-[10px] font-extrabold font-mono" style={{ color:G }}>{u.codigo}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor:es.bg, color:es.color }}>{u.estado}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color:"var(--muni-sub)" }}>
                    <span>Tel: {u.telefono || "—"}</span>
                    <span>Ingreso: {u.ingreso}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setModalUser(u)} className="flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all" style={{ color:G, borderColor:G }}>Editar</button>
                    <button onClick={() => toggleEstado(u.id)} className="flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all"
                      style={{ color:u.estado==="Activo"?"#DC2626":"#16A34A", borderColor:u.estado==="Activo"?"#DC2626":"#16A34A" }}>
                      {u.estado==="Activo"?"Desactivar":"Activar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4 px-5 py-3 border-t flex-wrap" style={{ borderColor:"var(--muni-border)", backgroundColor:"var(--muni-surface2)" }}>
            <p className="text-xs" style={{ color:"var(--muni-sub)" }}>
              Mostrando <strong style={{ color:"var(--muni-text)" }}>{filtered.length===0?0:(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)}</strong> de <strong style={{ color:"var(--muni-text)" }}>{filtered.length}</strong> registros
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40"
                style={{ borderColor:"var(--muni-border)", color:"var(--muni-sub)" }}>
                <Icons.ChevLeft/>
              </button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all border"
                  style={{ backgroundColor:n===page?G:"transparent", color:n===page?"#FFFFFF":"var(--muni-sub)", borderColor:n===page?G:"var(--muni-border)" }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40"
                style={{ borderColor:"var(--muni-border)", color:"var(--muni-sub)" }}>
                <Icons.ChevRight/>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal */}
      {modalUser !== undefined && (
        <NuevoUsuarioModal
          usuario={modalUser}
          onClose={() => setModalUser(undefined)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
