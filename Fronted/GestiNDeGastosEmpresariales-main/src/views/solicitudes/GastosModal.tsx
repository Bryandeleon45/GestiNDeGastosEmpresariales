import { useState, useRef } from "react"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { DEPS_LIST } from "@/models/solicitudes"
import { GASTOS_DATA, ESTADO_BADGE } from "@/models/gastos"
import Dropdown from "@/views/common/Dropdown"

export default function GastosModal({
  onClose,
  onPDF,
}: {
  onClose: () => void
  onPDF: () => void
}) {
  const [dep, setDep] = useState("Oficina de Agua")
  const [año, setAño] = useState("2026")
  const [mes, setMes] = useState("Todos los Meses")
  const [añoOpen, setAñoOpen] = useState(true)
  const overlayRef = useRef<HTMLDivElement>(null)
  const rows =
    mes === "Todos los Meses"
      ? GASTOS_DATA
      : GASTOS_DATA.filter((r) => r.mes === mes)
  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.52)",
        backdropFilter: "blur(1px)",
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col"
        style={{ animation: "modalIn 0.22s cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: G }}
            >
              <Icons.Money />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Control de Gastos del Departamento
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            <Icons.X />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <Dropdown
              label="Departamento"
              value={dep}
              options={DEPS_LIST}
              onChange={setDep}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Año Fiscal
              </label>
              <div className="relative">
                <button
                  onClick={() => setAñoOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-white border rounded-lg transition-all"
                  style={{
                    borderColor: añoOpen ? G : "#D1D5DB",
                    boxShadow: añoOpen ? `0 0 0 3px ${G}22` : "none",
                  }}
                >
                  <span className="font-medium text-gray-800">{año}</span>
                  <span className="text-gray-400">
                    {añoOpen ? <Icons.ChevUp /> : <Icons.ChevDown />}
                  </span>
                </button>
                {añoOpen && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[300] overflow-hidden"
                    style={{ animation: "dropIn 0.13s ease-out" }}
                  >
                    {["2026", "2025", "2024", "2023"].map((y) => (
                      <button
                        key={y}
                        onClick={() => {
                          setAño(y)
                          setAñoOpen(false)
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors"
                        style={{
                          backgroundColor: y === año ? GL : "white",
                          color: y === año ? G : "#374151",
                        }}
                      >
                        <span className="font-medium">{y}</span>
                        {y === año && (
                          <span style={{ color: G }}>
                            <Icons.CheckMark />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Dropdown
              label="Mes"
              value={mes}
              options={["Todos los Meses", "Enero", "Febrero", "Marzo"]}
              onChange={setMes}
            />
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["MES", "PRESUPUESTO", "EJECUTADO", "SALDO", "ESTADO"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.mes}
                    className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/70 ${
                      i % 2 === 1 ? "bg-gray-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-800">
                      {r.mes}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-mono text-gray-700">
                      {r.presupuesto}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-mono text-gray-700">
                      {r.ejecutado}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-sm font-bold font-mono ${
                          r.saldoC === "green"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {r.saldo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${ESTADO_BADGE[r.estado]}`}
                      >
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
            <div className="flex items-center gap-2.5 flex-1 px-5 py-3">
              <span className="text-gray-500">
                <Icons.Wallet />
              </span>
              <span className="text-sm font-semibold text-gray-700">
                Total Ejecutado: <b className="text-gray-900">Q 125,600.00</b>
              </span>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex items-center gap-2.5 flex-1 px-5 py-3">
              <span className="text-gray-500">
                <Icons.PiggyBank />
              </span>
              <span className="text-sm font-semibold text-gray-700">
                Presupuesto Restante:{" "}
                <b className="text-gray-900">Q 474,400.00</b>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            Cerrar
          </button>
          <button
            onClick={onPDF}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-all shadow-sm active:scale-95"
            style={{ backgroundColor: G }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#175228")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = G)}
          >
            <Icons.PDF />
            Generar Reporte PDF
          </button>
        </div>
      </div>
    </div>
  )
}
