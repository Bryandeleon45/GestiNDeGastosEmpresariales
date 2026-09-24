import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { COMP_ITEMS, COMP_PROVS, BEST_PER_ITEM } from "@/models/proformas"
import ConfirmarAdjudicacionModal from "@/views/proformas/ConfirmarAdjudicacionModal"
import { useProformasController } from "@/controllers/useProformasController"

export default function ProformasView({
  onToast,
  onNav,
}: {
  onToast: (m: string, s: string) => void
  onNav: (key: string) => void
}) {
  const {
    winner,
    setWinner,
    showConfirm,
    setShowConfirm,
    adjudicado,
    setAdjudicado,
    hoveredCol,
    setHoveredCol,
  } = useProformasController()

  const fmt = (n: number) =>
    `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`

  const DECISION_CARDS = [
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
      ),
      label: "OFERTA MÁS ECONÓMICA",
      title: "Ferretería El Sol",
      body: "Ahorro del 2.5% respecto a la media de mercado en esta cotización.",
    },
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
        >
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <path d="M16 8l5 5-5 5" />
          <path d="M10 16v5" />
          <path d="M6 16v5" />
        </svg>
      ),
      label: "MEJOR TIEMPO DE ENTREGA",
      title: "Distribuidora Panajachel",
      body: "Entrega garantizada en menos de 24 horas para todos los ítems.",
    },
    {
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      label: "CUMPLIMIENTO TÉCNICO",
      title: null,
      body: "Se verificó la vigencia de RTU y patente de comercio de los 3 proveedores.",
      status: "Todos los proveedores cumplen",
    },
  ]

  return (
    <>
      <div className="flex-1 overflow-auto" style={{ background: "#F8F9FA" }}>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 flex-wrap">
            <span>Adquisiciones</span>
            <Icons.ChevRight />
            <span>Proformas</span>
            <Icons.ChevRight />
            <span style={{ color: G }}>Comparativa de Precios</span>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                Comparativa de Proformas
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Análisis comparativo para la adjudicación de suministros de
                oficina.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() =>
                  onToast(
                    "Exportando cuadro comparativo…",
                    "El archivo Excel se descargará en un momento.",
                  )
                }
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all hover:bg-gray-50"
                style={{ color: G, borderColor: G }}
              >
                <Icons.PDF /> Exportar Cuadro
              </button>
              <button
                onClick={() => {
                  if (!winner && !adjudicado) {
                    onToast(
                      "Selecciona un proveedor ganador primero.",
                      "Haz clic en «Seleccionar Ganadora» en la tabla.",
                    )
                    return
                  }
                  setShowConfirm(true)
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-90"
                style={{ backgroundColor: G }}
              >
                Finalizar Comparativa
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: G }}
                >
                  <Icons.Doc />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900 leading-none">
                    Solicitud de Compra #SOL-2023-084
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                    Resumen del Requerimiento
                  </p>
                </div>
              </div>
              <span
                className="text-xs font-extrabold px-3 py-1 rounded-full text-white uppercase tracking-wide"
                style={{ backgroundColor: adjudicado ? "#16A34A" : "#22C55E" }}
              >
                {adjudicado ? "FASE: ADJUDICADO" : "FASE: COMPARACIÓN"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
              {[
                {
                  label: "Dependencia Solicitante",
                  value: "Dirección Administrativa",
                  accent: false,
                },
                {
                  label: "Fecha de Solicitud",
                  value: "12 de Octubre, 2023",
                  accent: false,
                },
                {
                  label: "Presupuesto Estimado",
                  value: "Q 12,500.00",
                  accent: true,
                },
                {
                  label: "Categoría",
                  value: "Suministros de Oficina",
                  accent: false,
                },
              ].map((f) => (
                <div key={f.label} className="px-5 py-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {f.label}
                  </p>
                  <p
                    className={`text-sm font-bold mt-1 ${
                      f.accent ? "" : "text-gray-900"
                    }`}
                    style={f.accent ? { color: G } : {}}
                  >
                    {f.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-4 text-left w-52 bg-gray-50 border-r border-gray-100 sticky left-0 z-10">
                      <p className="text-xs font-bold text-gray-700">
                        Ítem / Descripción
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                        CANT.
                      </p>
                    </th>
                    {COMP_PROVS.map((prov) => {
                      const isWinner = winner === prov.id
                      const isHovered = hoveredCol === prov.id
                      return (
                        <th
                          key={prov.id}
                          onMouseEnter={() => setHoveredCol(prov.id)}
                          onMouseLeave={() => setHoveredCol(null)}
                          className="px-4 py-4 text-left border-r border-gray-100 last:border-r-0 transition-colors"
                          style={{
                            backgroundColor: isWinner
                              ? GL
                              : isHovered
                                ? "#FAFFFE"
                                : undefined,
                            minWidth: 200,
                          }}
                        >
                          <p
                            className="text-sm font-extrabold leading-none"
                            style={{ color: G }}
                          >
                            {prov.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border text-gray-600 border-gray-200 bg-gray-50">
                              {prov.provId}
                            </span>
                            <span className="text-[11px] font-semibold text-amber-500">
                              ★ {prov.rating}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {COMP_ITEMS.map((item, itemIdx) => (
                    <tr key={item.label} className="border-b border-gray-50">
                      <td className="px-4 py-4 bg-white border-r border-gray-100 sticky left-0 z-10">
                        <p className="text-sm font-bold text-gray-900 leading-snug">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.desc}
                        </p>
                        <p className="text-xs font-bold text-gray-500 mt-1">
                          {item.cant.toString().padStart(2, "0")}
                        </p>
                      </td>
                      {COMP_PROVS.map((prov) => {
                        const cell = prov.items[itemIdx]
                        const isBest = BEST_PER_ITEM[itemIdx].includes(prov.id)
                        const isWinner = winner === prov.id
                        return (
                          <td
                            key={prov.id}
                            onMouseEnter={() => setHoveredCol(prov.id)}
                            onMouseLeave={() => setHoveredCol(null)}
                            className="px-4 py-4 border-r border-gray-50 last:border-r-0 transition-colors"
                            style={{
                              backgroundColor: isWinner
                                ? GL
                                : hoveredCol === prov.id
                                  ? "#FAFFFE"
                                  : undefined,
                            }}
                          >
                            <p className="text-xs text-gray-500">
                              U: {fmt(cell.unit)}
                            </p>
                            <p className="text-sm font-extrabold text-gray-900 mt-0.5">
                              {fmt(cell.total)}
                            </p>
                            {isBest && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: GL, color: G }}
                              >
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2.5}
                                >
                                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                                  <polyline points="17 18 23 18 23 12" />
                                </svg>
                                MEJOR PRECIO
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  <tr
                    className="border-b border-gray-100"
                    style={{ backgroundColor: "#F9FAFB" }}
                  >
                    <td className="px-4 py-3.5 bg-gray-50 border-r border-gray-100 sticky left-0 z-10">
                      <p className="text-sm font-bold text-gray-700">
                        Tiempo de Entrega
                      </p>
                    </td>
                    {COMP_PROVS.map((prov) => {
                      const isWinner = winner === prov.id
                      return (
                        <td
                          key={prov.id}
                          onMouseEnter={() => setHoveredCol(prov.id)}
                          onMouseLeave={() => setHoveredCol(null)}
                          className="px-4 py-3.5 border-r border-gray-100 last:border-r-0 transition-colors"
                          style={{
                            backgroundColor: isWinner
                              ? GL
                              : hoveredCol === prov.id
                                ? "#FAFFFE"
                                : "#F9FAFB",
                          }}
                        >
                          <p className="text-sm font-semibold text-gray-700">
                            {prov.entrega}
                          </p>
                        </td>
                      )
                    })}
                  </tr>

                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-4 bg-gray-50 border-r border-gray-100 sticky left-0 z-10">
                      <p className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                        Total General
                      </p>
                    </td>
                    {COMP_PROVS.map((prov) => {
                      const total = prov.items.reduce((s, i) => s + i.total, 0)
                      const isWinner = winner === prov.id
                      return (
                        <td
                          key={prov.id}
                          onMouseEnter={() => setHoveredCol(prov.id)}
                          onMouseLeave={() => setHoveredCol(null)}
                          className="px-4 py-4 border-r border-gray-100 last:border-r-0 transition-colors"
                          style={{
                            backgroundColor: isWinner
                              ? GL
                              : hoveredCol === prov.id
                                ? "#FAFFFE"
                                : undefined,
                          }}
                        >
                          <p
                            className="text-xl font-extrabold"
                            style={{ color: isWinner ? G : "#111827" }}
                          >
                            {fmt(total)}
                          </p>
                        </td>
                      )
                    })}
                  </tr>

                  <tr>
                    <td className="px-4 py-4 bg-white border-r border-gray-100 sticky left-0 z-10" />
                    {COMP_PROVS.map((prov) => {
                      const isWinner = winner === prov.id
                      return (
                        <td
                          key={prov.id}
                          onMouseEnter={() => setHoveredCol(prov.id)}
                          onMouseLeave={() => setHoveredCol(null)}
                          className="px-4 py-4 border-r border-gray-100 last:border-r-0 transition-colors"
                          style={{
                            backgroundColor: isWinner
                              ? GL
                              : hoveredCol === prov.id
                                ? "#FAFFFE"
                                : undefined,
                          }}
                        >
                          {isWinner ? (
                            <button
                              onClick={() => setShowConfirm(true)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 shadow-sm active:scale-95"
                              style={{ backgroundColor: G }}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Adjudicar Oferta
                            </button>
                          ) : (
                            <button
                              onClick={() => setWinner(prov.id)}
                              className="w-full py-2.5 text-sm font-semibold rounded-xl border-2 transition-all hover:bg-gray-50 active:scale-95"
                              style={{ color: G, borderColor: G }}
                            >
                              Seleccionar Ganadora
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DECISION_CARDS.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: GL, color: G }}
                  >
                    {card.icon}
                  </div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                    {card.label}
                  </p>
                </div>
                {card.status && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <p className="text-sm font-bold text-gray-900">
                      {card.status}
                    </p>
                  </div>
                )}
                {card.title && (
                  <p
                    className="text-base font-extrabold mb-1"
                    style={{ color: G }}
                  >
                    {card.title}
                  </p>
                )}
                <p className="text-sm text-gray-500 leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-600 mb-3">
              Notas Administrativas:
            </p>
            <ul className="space-y-1.5">
              {[
                "Los precios incluyen IVA (12%) conforme a la legislación guatemalteca vigente.",
                "La validez de las proformas es de 30 días calendario a partir de la fecha de recepción.",
                "Se recomienda la adjudicación a Distribuidora Panajachel debido a la urgencia del requerimiento a pesar de no ser el precio más bajo absoluto.",
              ].map((note) => (
                <li
                  key={note}
                  className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-gray-400" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {showConfirm && winner && (
        <ConfirmarAdjudicacionModal
          winner={winner}
          onClose={() => setShowConfirm(false)}
          onConfirm={() => {
            setAdjudicado(true)
            const prov = COMP_PROVS.find((p) => p.id === winner)!
            setTimeout(
              () =>
                onToast(
                  "¡Oferta adjudicada!",
                  `Orden de compra generada para ${prov.name}.`,
                ),
              150,
            )
          }}
        />
      )}
    </>
  )
}
