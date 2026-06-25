import type { ReactNode } from 'react'

export function Metric({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 last:border-b-0 sm:odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
      <div>
        <p className="text-sm text-zinc-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#eff7f6] text-cyan-700">
        {icon}
      </div>
    </div>
  )
}
