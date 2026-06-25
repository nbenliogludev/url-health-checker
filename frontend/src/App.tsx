import * as Sentry from '@sentry/react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AppHeader } from './components/app-header'
import { CreateJobForm } from './components/create-job-form'
import { JobDetailsPanel } from './components/job-details-panel'
import { JobsList } from './components/jobs-list'
import { useJobPolling } from './hooks/use-job-polling'
import { isTerminalJobStatus } from './lib/job-status'
import { useJobsStore } from './store/jobs'

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
  const isCancellingJob = useJobsStore((state) => state.isCancellingJob)
  const createError = useJobsStore((state) => state.createError)
  const cancelError = useJobsStore((state) => state.cancelError)
  const createdJobId = useJobsStore((state) => state.createdJobId)
  const loadJobs = useJobsStore((state) => state.loadJobs)
  const refreshJob = useJobsStore((state) => state.refreshJob)
  const selectJob = useJobsStore((state) => state.selectJob)
  const createJob = useJobsStore((state) => state.createJob)
  const cancelJob = useJobsStore((state) => state.cancelJob)

  useEffect(() => {
    void loadJobs()
  }, [loadJobs])

  useEffect(() => {
    Sentry.setTag('job.active_id', activeJobId ?? 'none')
    Sentry.setTag('job.active_status', activeJobDetails?.status ?? 'none')
  }, [activeJobDetails?.status, activeJobId])

  const activeJob = jobs.find((job) => job.id === activeJobId) ?? null
  const activeJobStatus = activeJobDetails?.status ?? activeJob?.status
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
  const canCancelJob =
    Boolean(activeJobId) &&
    Boolean(activeJobStatus) &&
    !isTerminalJobStatus(activeJobStatus) &&
    !isCancellingJob

  useJobPolling({
    activeJobId,
    activeJobStatus,
    refreshJob,
  })

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

  async function handleCancelJob() {
    if (!activeJobId || !canCancelJob) {
      return
    }

    await cancelJob(activeJobId)
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-zinc-950">
      <AppHeader
        totalJobs={jobs.length}
        runningJobs={runningJobs}
        totalSuccess={totalSuccess}
        totalErrors={totalErrors}
        isLoadingJobs={isLoadingJobs}
        isCreatingJob={isCreatingJob}
        canCreateJob={canCreateJob}
        onRefreshJobs={() => void loadJobs()}
      />

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-5">
          <CreateJobForm
            urlInput={urlInput}
            createError={createError}
            createdJobId={createdJobId}
            isCreatingJob={isCreatingJob}
            canCreateJob={canCreateJob}
            onUrlInputChange={setUrlInput}
            onSubmit={handleCreateJob}
          />

          <JobsList
            jobs={jobs}
            activeJobId={activeJobId}
            isLoadingJobs={isLoadingJobs}
            jobsError={jobsError}
            onSelectJob={(jobId) => void selectJob(jobId)}
          />
        </aside>

        <JobDetailsPanel
          activeJob={activeJob}
          activeJobDetails={activeJobDetails}
          activeJobStatus={activeJobStatus}
          activeUrlChecks={activeUrlChecks}
          activeProcessedUrls={activeProcessedUrls}
          activeRemainingUrls={activeRemainingUrls}
          progress={progress}
          isLoadingDetails={isLoadingDetails}
          isCancellingJob={isCancellingJob}
          canCancelJob={canCancelJob}
          detailsError={detailsError}
          cancelError={cancelError}
          onCancelJob={() => void handleCancelJob()}
        />
      </div>
    </main>
  )
}

export default App
