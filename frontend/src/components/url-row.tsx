import { Link2 } from 'lucide-react'
import type { UrlCheck } from '../api/jobs'
import { formatUrlCheckTiming } from '../lib/date'
import { StatusBadge } from './status-badge'

export function UrlRow({ item }: { item: UrlCheck }) {
  return (
    <div className="grid gap-3 px-4 py-3 xl:grid-cols-[minmax(0,1fr)_140px_120px_160px] xl:items-center">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <Link2 size={16} className="shrink-0 text-zinc-400" />
          <p className="truncate font-mono text-sm text-zinc-950">{item.url}</p>
        </div>
        {item.errorMessage ? (
          <p className="mt-1 text-sm text-rose-700">{item.errorMessage}</p>
        ) : null}
      </div>
      <StatusBadge status={item.status} />
      <div className="text-sm text-zinc-600">
        {item.httpStatus ? `HTTP ${item.httpStatus}` : 'No status'}
      </div>
      <div className="text-sm text-zinc-600">{formatUrlCheckTiming(item)}</div>
    </div>
  )
}
