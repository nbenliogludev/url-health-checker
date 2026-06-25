import { LoaderCircle } from 'lucide-react'
import type { JobSummary } from '../api/jobs'
import { formatDate } from '../lib/date'
import { StatusBadge } from './status-badge'

type JobsListProps = {
  jobs: JobSummary[]
  activeJobId: string | null
  isLoadingJobs: boolean
  jobsError: string | null
  onSelectJob: (jobId: string) => void
}

export function JobsList({
  jobs,
  activeJobId,
  isLoadingJobs,
  jobsError,
  onSelectJob,
}: JobsListProps) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-base font-semibold">Jobs</h2>
        <span className="text-sm text-zinc-500">{jobs.length}</span>
      </div>
      {jobsError ? (
        <div className="border-b border-zinc-200 p-4">
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {jobsError}
          </div>
        </div>
      ) : null}
      <div className="divide-y divide-zinc-200">
        {isLoadingJobs && jobs.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-4 text-sm text-zinc-500">
            <LoaderCircle size={16} className="animate-spin" />
            Loading jobs
          </div>
        ) : null}
        {!isLoadingJobs && jobs.length === 0 ? (
          <div className="px-4 py-4 text-sm text-zinc-500">No jobs yet</div>
        ) : null}
        {jobs.map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => onSelectJob(job.id)}
            className={`block w-full px-4 py-3 text-left transition hover:bg-zinc-50 ${
              activeJobId === job.id ? 'bg-cyan-50/60' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-mono text-sm text-zinc-900">
                {job.id}
              </span>
              <StatusBadge status={job.status} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm text-zinc-500">
              <span>{formatDate(job.createdAt)}</span>
              <span>{job.totalUrls} URLs</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">
                {job.stats.success} success
              </span>
              <span className="rounded-md bg-rose-50 px-2 py-1 text-rose-800">
                {job.stats.error} error
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
