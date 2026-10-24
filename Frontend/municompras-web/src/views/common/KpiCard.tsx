import { G, GL } from "@/constants/theme"

export default function KpiCard({
  title,
  value,
  sub,
  subColor,
  icon,
  progress,
}: {
  title: string
  value: string
  sub: string
  subColor?: string
  icon: React.ReactNode
  progress?: number
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">
          {title}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: GL, color: G }}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
        {value}
      </p>
      {progress !== undefined ? (
        <div className="space-y-1.5">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, backgroundColor: G }}
            />
          </div>
          <p className={`text-xs font-medium ${subColor || "text-gray-400"}`}>
            {sub}
          </p>
        </div>
      ) : (
        <p className={`text-xs font-medium ${subColor || "text-gray-400"}`}>
          {sub}
        </p>
      )}
    </div>
  )
}
