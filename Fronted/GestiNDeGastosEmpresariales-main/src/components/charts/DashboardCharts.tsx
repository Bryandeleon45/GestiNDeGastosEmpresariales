import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { G, GL } from "@/constants/theme"
import { Icons } from "@/components/common/Icons"
import { CHART_DATA } from "@/models/charts"

export function DashboardBarChart({ onBarClick }: { onBarClick?: () => void }) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Gastos por Departamento
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Clic en una barra para ver el detalle
          </p>
        </div>
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 cursor-pointer hover:border-gray-300 transition-colors">
          Octubre 2026 <Icons.ChevDown />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart
          data={CHART_DATA}
          barSize={34}
          margin={{ top: 8, right: 0, bottom: 0, left: -10 }}
          onClick={onBarClick}
        >
          <CartesianGrid vertical={false} stroke="#F3F4F6" />
          <XAxis
            dataKey="dept"
            tick={{ fontSize: 10, fill: "#9CA3AF", fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9CA3AF", fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #E5E7EB",
            }}
            formatter={(v) => [
              `Q ${Number(v).toLocaleString("es-GT")}`,
              "Gasto",
            ]}
            cursor={{ fill: GL }}
          />
          <Bar
            dataKey="gasto"
            radius={[3, 3, 0, 0]}
            cursor="pointer"
            onMouseEnter={(_: unknown, i: number) =>
              setHoveredBar(CHART_DATA[i].dept)
            }
            onMouseLeave={() => setHoveredBar(null)}
          >
            {CHART_DATA.map((e) => (
              <Cell key={e.dept} fill={hoveredBar === e.dept ? "#155228" : G} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
