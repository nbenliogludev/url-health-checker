import type { JobStatus, UrlCheckStatus } from '../api/jobs'

const statusLabel: Record<JobStatus | UrlCheckStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  failed: 'Failed',
  success: 'Success',
  error: 'Error',
}

const statusClass: Record<JobStatus | UrlCheckStatus, string> = {
  pending: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  in_progress: 'bg-cyan-50 text-cyan-800 ring-cyan-200',
  completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  cancelled: 'bg-amber-50 text-amber-800 ring-amber-200',
  failed: 'bg-rose-50 text-rose-800 ring-rose-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  error: 'bg-rose-50 text-rose-800 ring-rose-200',
}

export function StatusBadge({
  status,
}: {
  status: JobStatus | UrlCheckStatus
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  )
}
