import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ListFilter,
  LoaderCircle,
  Play,
  RefreshCw,
} from 'lucide-react'
import { Metric } from './metric'

type AppHeaderProps = {
  totalJobs: number
  runningJobs: number
  totalSuccess: number
  totalErrors: number
  isLoadingJobs: boolean
  isCreatingJob: boolean
  canCreateJob: boolean
  onRefreshJobs: () => void
}

export function AppHeader({
  totalJobs,
  runningJobs,
  totalSuccess,
  totalErrors,
  isLoadingJobs,
  isCreatingJob,
  canCreateJob,
  onRefreshJobs,
}: AppHeaderProps) {
  return (
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
              onClick={onRefreshJobs}
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
          <Metric
            label="Total jobs"
            value={totalJobs.toString()}
            icon={<ListFilter size={18} />}
          />
          <Metric
            label="Running"
            value={runningJobs.toString()}
            icon={<LoaderCircle size={18} />}
          />
          <Metric
            label="Success"
            value={totalSuccess.toString()}
            icon={<CheckCircle2 size={18} />}
          />
          <Metric
            label="Errors"
            value={totalErrors.toString()}
            icon={<AlertTriangle size={18} />}
          />
        </section>
      </div>
    </header>
  )
}
