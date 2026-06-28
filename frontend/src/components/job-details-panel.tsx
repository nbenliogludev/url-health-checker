import { Clock3, LoaderCircle, SearchCheck, XCircle } from 'lucide-react'
import type { JobDetails, JobStatus, JobSummary, UrlCheck } from '../api/jobs'
import { formatDate } from '../lib/date'
import { isTerminalJobStatus } from '../lib/job-status'
import { JobStat } from './job-stat'
import { StatusBadge } from './status-badge'
import { UrlRow } from './url-row'

type JobDetailsPanelProps = {
  activeJob: JobSummary | null
  activeJobDetails: JobDetails | null
  activeJobStatus?: JobStatus
  activeUrlChecks: UrlCheck[]
  activeProcessedUrls: number
  activeRemainingUrls: number
  progress: number
  isLoadingDetails: boolean
  isCancellingJob: boolean
  canCancelJob: boolean
  detailsError: string | null
  cancelError: string | null
  onCancelJob: () => void
}

export function JobDetailsPanel({
  activeJob,
  activeJobDetails,
  activeJobStatus,
  activeUrlChecks,
  activeProcessedUrls,
  activeRemainingUrls,
  progress,
  isLoadingDetails,
  isCancellingJob,
  canCancelJob,
  detailsError,
  cancelError,
  onCancelJob,
}: JobDetailsPanelProps) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white">
      {activeJob ? (
        <>
          <div className="border-b border-zinc-200 p-4">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">Job {activeJob.id}</h2>
                  <StatusBadge status={activeJobDetails?.status ?? activeJob.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={15} />
                    {formatDate(activeJobDetails?.createdAt ?? activeJob.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <SearchCheck size={15} />
                    {activeProcessedUrls} of {activeJob.totalUrls}
                  </span>
                </div>
              </div>
              {activeJobStatus && !isTerminalJobStatus(activeJobStatus) ? (
                <button
                  type="button"
                  disabled={!canCancelJob}
                  onClick={onCancelJob}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  {isCancellingJob ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <XCircle size={17} />
                  )}
                  {isCancellingJob ? 'Cancelling' : 'Cancel job'}
                </button>
              ) : null}
            </div>

            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-zinc-600">Progress</span>
                <span className="font-medium text-zinc-900">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-cyan-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid divide-y divide-zinc-200 border-b border-zinc-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <JobStat label="Success" value={activeJob.stats.success.toString()} />
            <JobStat label="Errors" value={activeJob.stats.error.toString()} />
            <JobStat label="Remaining" value={activeRemainingUrls.toString()} />
          </div>

          {cancelError ? (
            <div className="border-b border-zinc-200 p-4">
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {cancelError}
              </div>
            </div>
          ) : null}

          {detailsError ? (
            <div className="border-b border-zinc-200 p-4">
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {detailsError}
              </div>
            </div>
          ) : null}

          {isLoadingDetails ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-zinc-500">
              <LoaderCircle size={16} className="animate-spin" />
              Loading details
            </div>
          ) : null}

          {!isLoadingDetails && activeUrlChecks.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">
              No URLs
            </div>
          ) : null}

          {activeUrlChecks.length > 0 ? (
            <div className="divide-y divide-zinc-200">
              {activeUrlChecks.map((item, index) => (
                <UrlRow key={index} item={item} />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="px-4 py-10 text-center text-sm text-zinc-500">
          No active job
        </div>
      )}
    </section>
  )
}
