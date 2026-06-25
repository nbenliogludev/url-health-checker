import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Link2,
  ListFilter,
  LoaderCircle,
  Play,
  RefreshCw,
  SearchCheck,
} from 'lucide-react'
import type { JobStatus, UrlCheckStatus } from './api/jobs'
import { useJobsStore } from './store/jobs'

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

function App() {
  const [urlInput, setUrlInput] = useState('https://example.com\nhttps://github.com')
  const jobs = useJobsStore((state) => state.jobs)
  const activeJobId = useJobsStore((state) => state.activeJobId)
  const activeJobDetails = useJobsStore((state) => state.activeJobDetails)
  const isLoadingJobs = useJobsStore((state) => state.isLoadingJobs)
  const isLoadingDetails = useJobsStore((state) => state.isLoadingDetails)
  const jobsError = useJobsStore((state) => state.jobsError)
  const detailsError = useJobsStore((state) => state.detailsError)
  const isCreatingJob = useJobsStore((state) => state.isCreatingJob)
  const createError = useJobsStore((state) => state.createError)
  const createdJobId = useJobsStore((state) => state.createdJobId)
  const loadJobs = useJobsStore((state) => state.loadJobs)
  const selectJob = useJobsStore((state) => state.selectJob)
  const createJob = useJobsStore((state) => state.createJob)

  useEffect(() => {
    void loadJobs()
  }, [loadJobs])

  const activeJob = jobs.find((job) => job.id === activeJobId) ?? null
  const activeUrlChecks = activeJobDetails?.urls ?? []
  const urlsToCreate = useMemo(
    () =>
      urlInput
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean),
    [urlInput],
  )
  const totalSuccess = jobs.reduce((sum, job) => sum + job.stats.success, 0)
  const totalErrors = jobs.reduce((sum, job) => sum + job.stats.error, 0)
  const runningJobs = jobs.filter(
    (job) => job.status === 'pending' || job.status === 'in_progress',
  ).length
  const activeProcessedUrls = activeJobDetails
    ? activeUrlChecks.filter((item) =>
        ['success', 'error', 'cancelled'].includes(item.status),
      ).length
    : activeJob
      ? activeJob.stats.success + activeJob.stats.error
      : 0
  const activeRemainingUrls = activeJob
    ? Math.max(activeJob.totalUrls - activeProcessedUrls, 0)
    : 0
  const progress =
    activeJob && activeJob.totalUrls > 0
      ? Math.round((activeProcessedUrls / activeJob.totalUrls) * 100)
      : 0
  const canCreateJob = urlsToCreate.length > 0 && !isCreatingJob

  async function handleCreateJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!urlsToCreate.length) {
      return
    }

    const jobId = await createJob(urlsToCreate)

    if (jobId) {
      setUrlInput('')
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-zinc-950 text-white">
                <Activity size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">URL Health Checker</h1>
                <p className="text-sm text-zinc-500">Async job dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoadingJobs}
                onClick={() => void loadJobs()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-300"
                aria-label="Refresh jobs"
                title="Refresh jobs"
              >
                <RefreshCw size={18} className={isLoadingJobs ? 'animate-spin' : ''} />
              </button>
              <button
                type="submit"
                form="create-job-form"
                disabled={!canCreateJob}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                {isCreatingJob ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Play size={17} />
                )}
                Run check
              </button>
            </div>
          </div>

          <section className="grid overflow-hidden rounded-md border border-zinc-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total jobs" value={jobs.length.toString()} icon={<ListFilter size={18} />} />
            <Metric label="Running" value={runningJobs.toString()} icon={<LoaderCircle size={18} />} />
            <Metric label="Success" value={totalSuccess.toString()} icon={<CheckCircle2 size={18} />} />
            <Metric label="Errors" value={totalErrors.toString()} icon={<AlertTriangle size={18} />} />
          </section>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-5">
          <section className="rounded-md border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="text-base font-semibold">New job</h2>
            </div>
            <form id="create-job-form" className="space-y-4 p-4" onSubmit={handleCreateJob}>
              <label className="block text-sm font-medium text-zinc-700" htmlFor="urls">
                URLs
              </label>
              <textarea
                id="urls"
                rows={7}
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                className="w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                placeholder={'https://example.com\nhttps://github.com'}
              />
              {createError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {createError}
                </p>
              ) : null}
              {createdJobId ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Created job <span className="font-mono">{createdJobId}</span>
                </p>
              ) : null}
              <button
                type="submit"
                disabled={!canCreateJob}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                {isCreatingJob ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Play size={17} />
                )}
                {isCreatingJob ? 'Creating job' : 'Start job'}
              </button>
            </form>
          </section>

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
                  onClick={() => void selectJob(job.id)}
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
        </aside>

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
                  {activeUrlChecks.map((item) => (
                    <UrlRow key={item.url} item={item} />
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
      </div>
    </main>
  )
}

function Metric({
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

function JobStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: JobStatus | UrlCheckStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  )
}

function UrlRow({
  item,
}: {
  item: {
    url: string
    status: UrlCheckStatus
    httpStatus?: number
    errorMessage?: string
    startedAt?: string
    finishedAt?: string
    durationMs?: number
  }
}) {
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
      <div className="text-sm text-zinc-600">
        {formatUrlCheckTiming(item)}
      </div>
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    timeStyle: 'medium',
  }).format(date)
}

function formatUrlCheckTiming(item: {
  startedAt?: string
  finishedAt?: string
  durationMs?: number
}) {
  if (item.durationMs) {
    return `${item.durationMs} ms`
  }

  if (item.startedAt) {
    return formatTime(item.startedAt)
  }

  return 'Waiting'
}

export default App
