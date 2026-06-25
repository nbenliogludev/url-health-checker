export function JobStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  )
}
