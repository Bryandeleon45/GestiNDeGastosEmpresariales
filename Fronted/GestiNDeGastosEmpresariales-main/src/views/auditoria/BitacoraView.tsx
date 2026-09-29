import { useState, useEffect, useCallback } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import {
  listarBitacora,
  exportarBitacoraCSV,
  type BitacoraEntry,
} from "@/api/bitacora"

const MODULOS = [
  "Autenticación",
  "Usuarios",
  "Roles",
  "Configuración",
  "Auditoría",
]

function fmtFecha(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export default function BitacoraView({
  onToast,
}: {
  onToast: (m: string, s: string) => void
}) {
  const [data, setData] = useState<BitacoraEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12
  const [offline, setOffline] = useState(false)

  const [fUsuario, setFUsuario] = useState("")
  const [fModulo, setFModulo] = useState("")
  const [fAccion, setFAccion] = useState("")
  const [fDesde, setFDesde] = useState("")
  const [fHasta, setFHasta] = useState("")

  const load = useCallback(async () => {
    try {
      const res = await listarBitacora({
        usuario: fUsuario,
        modulo: fModulo,
        accion: fAccion,
        desde: fDesde,
        hasta: fHasta,
        page,
        pageSize: PAGE_SIZE,
      })
      setData(res.data)
      setTotal(res.total)
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }, [fUsuario, fModulo, fAccion, fDesde, fHasta, page])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const applyFilters = () => {
    setPage(1)
    load()
  }

  const clearFilters = () => {
    setFUsuario("")
    setFModulo("")
    setFAccion("")
    setFDesde("")
    setFHasta("")
    setPage(1)
  }

  const exportCsv = async () => {
    try {
      const { url, headers } = exportarBitacoraCSV({
        usuario: fUsuario,
        modulo: fModulo,
        accion: fAccion,
        desde: fDesde,
        hasta: fHasta,
      })
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error("Error al exportar")
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = "bitacora_acceso.csv"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
      onToast("Bitácora exportada", "El archivo CSV fue descargado.")
    } catch (e) {
      onToast("Error", e instanceof Error ? e.message : "No se pudo exportar")
    }
  }

  const selectCls =
    "px-3 py-2.5 text-sm rounded-xl border outline-none cursor-pointer"
  const inputCls =
    "px-3 py-2.5 text-sm rounded-xl border outline-none transition-colors focus:border-[#1E5E2F]"

  return (
    <div
      className="flex-1 overflow-auto p-5"
      style={{ background: "var(--muni-bg)" }}
    >
      <div className="space-y-5 max-w-full">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl font-extrabold leading-tight"
              style={{ color: "var(--muni-text)" }}
            >
              Bitácora de Acceso
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muni-sub)" }}>
              Auditoría de accesos y actividades de los usuarios del sistema
            </p>
          </div>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90 active:scale-95 shrink-0"
            style={{ backgroundColor: G }}
          >
            <Icons.Download /> Exportar CSV
          </button>
        </div>

        {offline && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200">
            <Icons.Warning />
            Sin conexión con el servidor. La bitácora no se está sincronizando.
          </div>
        )}

        <div
          className="rounded-xl border p-4 flex flex-wrap items-end gap-3"
          style={{
            backgroundColor: "var(--muni-surface)",
            borderColor: "var(--muni-border)",
          }}
        >
          <div className="flex flex-col gap-1 min-w-[160px] flex-1">
            <label
              className="text-[10px] font-extrabold uppercase tracking-widest"
              style={{ color: "var(--muni-sub)" }}
            >
              Usuario
            </label>
            <input
              value={fUsuario}
              onChange={(e) => setFUsuario(e.target.value)}
              placeholder="Filtrar usuario..."
              className={inputCls}
              style={{ backgroundColor: "var(--muni-bg)", borderColor: "var(--muni-border)", color: "var(--muni-text)" }}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label
              className="text-[10px] font-extrabold uppercase tracking-widest"
              style={{ color: "var(--muni-sub)" }}
            >
              Módulo
            </label>
            <select
              value={fModulo}
              onChange={(e) => setFModulo(e.target.value)}
              className={selectCls}
              style={{ backgroundColor: "var(--muni-bg)", borderColor: "var(--muni-border)", color: "var(--muni-text)" }}
            >
              <option value="">Todos</option>
              {MODULOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label
              className="text-[10px] font-extrabold uppercase tracking-widest"
              style={{ color: "var(--muni-sub)" }}
            >
              Desde
            </label>
            <input
              type="date"
              value={fDesde}
              onChange={(e) => setFDesde(e.target.value)}
              className={inputCls}
              style={{ backgroundColor: "var(--muni-bg)", borderColor: "var(--muni-border)", color: "var(--muni-text)" }}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label
              className="text-[10px] font-extrabold uppercase tracking-widest"
              style={{ color: "var(--muni-sub)" }}
            >
              Hasta
            </label>
            <input
              type="date"
              value={fHasta}
              onChange={(e) => setFHasta(e.target.value)}
              className={inputCls}
              style={{ backgroundColor: "var(--muni-bg)", borderColor: "var(--muni-border)", color: "var(--muni-text)" }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: G }}
            >
              <Icons.Search /> Filtrar
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all hover:opacity-80"
              style={{ color: "var(--muni-sub)", borderColor: "var(--muni-border)" }}
            >
              Limpiar
            </button>
          </div>
        </div>

        <div
          className="rounded-xl border overflow-hidden shadow-sm"
          style={{
            backgroundColor: "var(--muni-surface)",
            borderColor: "var(--muni-border)",
          }}
        >
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    borderColor: "var(--muni-border)",
                    backgroundColor: "var(--muni-surface2)",
                  }}
                >
                  {["FECHA Y HORA", "USUARIO", "MÓDULO", "ACCIÓN", "IP", "DETALLE"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap"
                        style={{ color: "var(--muni-sub)" }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm"
                      style={{ color: "var(--muni-sub)" }}
                    >
                      No se encontraron registros con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  data.map((r) => (
                    <tr
                      key={r.id_bitacora}
                      className="border-b last:border-b-0 transition-colors"
                      style={{ borderColor: "var(--muni-border)" }}
                    >
                      <td
                        className="px-4 py-3 text-xs font-mono whitespace-nowrap"
                        style={{ color: "var(--muni-sub)" }}
                      >
                        {fmtFecha(r.fecha_acceso)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold" style={{ color: "var(--muni-text)" }}>
                          {r.nombre} {r.apellido}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold text-white"
                          style={{ backgroundColor: G }}
                        >
                          {r.modulo || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono" style={{ color: "var(--muni-sub)" }}>
                          {r.accion}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono" style={{ color: "var(--muni-sub)" }}>
                          {r.ip_acceso || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs" style={{ color: "var(--muni-sub)" }}>
                        {r.detalle || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y" style={{ borderColor: "var(--muni-border)" }}>
            {data.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm" style={{ color: "var(--muni-sub)" }}>
                No se encontraron registros.
              </p>
            ) : (
              data.map((r) => (
                <div key={r.id_bitacora} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold" style={{ color: "var(--muni-text)" }}>
                      {r.nombre} {r.apellido}
                    </span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                      style={{ backgroundColor: G }}
                    >
                      {r.modulo || "—"}
                    </span>
                  </div>
                  <p className="text-xs font-mono" style={{ color: "var(--muni-sub)" }}>
                    {fmtFecha(r.fecha_acceso)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muni-sub)" }}>
                    {r.accion} · {r.ip_acceso || "—"}
                  </p>
                </div>
              ))
            )}
          </div>

          <div
            className="flex items-center justify-between gap-4 px-5 py-3 border-t flex-wrap"
            style={{
              borderColor: "var(--muni-border)",
              backgroundColor: "var(--muni-surface2)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--muni-sub)" }}>
              Mostrando <strong style={{ color: "var(--muni-text)" }}>{data.length}</strong> de{" "}
              <strong style={{ color: "var(--muni-text)" }}>{total}</strong> registros
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40"
                style={{ borderColor: "var(--muni-border)", color: "var(--muni-sub)" }}
              >
                <Icons.ChevLeft />
              </button>
              <span className="text-xs font-bold" style={{ color: "var(--muni-text)" }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40"
                style={{ borderColor: "var(--muni-border)", color: "var(--muni-sub)" }}
              >
                <Icons.ChevRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
