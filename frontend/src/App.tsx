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
  XCircle,
} from 'lucide-react'

type JobStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed'
type UrlCheckStatus =
  | 'pending'
  | 'in_progress'
  | 'success'
  | 'error'
  | 'cancelled'

type JobSummary = {
  id: string
  createdAt: string
  status: JobStatus
  totalUrls: number
  stats: {
    success: number
    error: number
  }
}

type UrlCheck = {
  url: string
  status: UrlCheckStatus
  httpStatus?: number
  errorMessage?: string
  startedAt?: string
  finishedAt?: string
  durationMs?: number
}

const jobs: JobSummary[] = [
  {
    id: 'a9f3c4d2',
    createdAt: '2026-06-25 10:42',
    status: 'in_progress',
    totalUrls: 6,
    stats: { success: 3, error: 1 },
  },
  {
    id: 'bb7310fd',
    createdAt: '2026-06-25 10:18',
    status: 'completed',
    totalUrls: 4,
    stats: { success: 4, error: 0 },
  },
  {
    id: 'c13e8a59',
    createdAt: '2026-06-25 09:55',
    status: 'cancelled',
    totalUrls: 8,
    stats: { success: 2, error: 0 },
  },
]

const activeJob = jobs[0]

const urlChecks: UrlCheck[] = [
  {
    url: 'https://example.com',
    status: 'success',
    httpStatus: 200,
    startedAt: '10:42:11',
    finishedAt: '10:42:14',
    durationMs: 3210,
  },
  {
    url: 'https://github.com',
    status: 'success',
    httpStatus: 200,
    startedAt: '10:42:11',
    finishedAt: '10:42:17',
    durationMs: 6120,
  },
  {
    url: 'https://example.com/not-found',
    status: 'error',
    httpStatus: 404,
    errorMessage: 'HTTP status 404',
    startedAt: '10:42:12',
    finishedAt: '10:42:19',
    durationMs: 7350,
  },
  {
    url: 'https://vercel.com',
    status: 'success',
    httpStatus: 308,
    startedAt: '10:42:12',
    finishedAt: '10:42:15',
    durationMs: 2890,
  },
  {
    url: 'https://openai.com',
    status: 'in_progress',
    startedAt: '10:42:16',
  },
  {
    url: 'https://bad-domain.test',
    status: 'pending',
  },
]

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
  const processedUrls = activeJob.stats.success + activeJob.stats.error
  const progress = Math.round((processedUrls / activeJob.totalUrls) * 100)

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
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                aria-label="Refresh jobs"
                title="Refresh jobs"
              >
                <RefreshCw size={18} />
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
              >
                <Play size={17} />
                Run check
              </button>
            </div>
          </div>

          <section className="grid overflow-hidden rounded-md border border-zinc-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Total jobs" value="12" icon={<ListFilter size={18} />} />
            <Metric label="Running" value="2" icon={<LoaderCircle size={18} />} />
            <Metric label="Success" value="41" icon={<CheckCircle2 size={18} />} />
            <Metric label="Errors" value="7" icon={<AlertTriangle size={18} />} />
          </section>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-5">
          <section className="rounded-md border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="text-base font-semibold">New job</h2>
            </div>
            <div className="space-y-4 p-4">
              <label className="block text-sm font-medium text-zinc-700" htmlFor="urls">
                URLs
              </label>
              <textarea
                id="urls"
                rows={7}
                className="w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                placeholder={'https://example.com\nhttps://github.com'}
              />
              <button
                type="button"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
              >
                <Play size={17} />
                Start job
              </button>
            </div>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 className="text-base font-semibold">Jobs</h2>
              <span className="text-sm text-zinc-500">{jobs.length}</span>
            </div>
            <div className="divide-y divide-zinc-200">
              {jobs.map((job, index) => (
                <button
                  key={job.id}
                  type="button"
                  className={`block w-full px-4 py-3 text-left transition hover:bg-zinc-50 ${
                    index === 0 ? 'bg-cyan-50/60' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm text-zinc-900">{job.id}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-zinc-500">
                    <span>{job.createdAt}</span>
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
          <div className="border-b border-zinc-200 p-4">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">Job {activeJob.id}</h2>
                  <StatusBadge status={activeJob.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 size={15} />
                    {activeJob.createdAt}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <SearchCheck size={15} />
                    {processedUrls} of {activeJob.totalUrls}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-800 transition hover:bg-rose-100"
              >
                <XCircle size={17} />
                Cancel job
              </button>
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

          <div className="divide-y divide-zinc-200">
            {urlChecks.map((item) => (
              <UrlRow key={item.url} item={item} />
            ))}
          </div>
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
  icon: React.ReactNode
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

function StatusBadge({ status }: { status: JobStatus | UrlCheckStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  )
}

function UrlRow({ item }: { item: UrlCheck }) {
  return (
    <div className="grid gap-3 px-4 py-3 xl:grid-cols-[minmax(0,1fr)_140px_120px_120px] xl:items-center">
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
        {item.durationMs ? `${item.durationMs} ms` : item.startedAt ?? 'Waiting'}
      </div>
    </div>
  )
}

export default App
