import { useEffect } from 'react'
import type { JobStatus } from '../api/jobs'
import { isTerminalJobStatus } from '../lib/job-status'

const POLLING_INTERVAL_MS = 2000

type UseJobPollingParams = {
  activeJobId: string | null
  activeJobStatus?: JobStatus
  refreshJob: (jobId: string) => Promise<{ status: JobStatus } | null>
}

export function useJobPolling({
  activeJobId,
  activeJobStatus,
  refreshJob,
}: UseJobPollingParams) {
  useEffect(() => {
    if (
      !activeJobId ||
      !activeJobStatus ||
      isTerminalJobStatus(activeJobStatus)
    ) {
      return
    }

    const jobId = activeJobId
    let isCurrent = true
    let timeoutId: number | undefined

    async function poll() {
      const jobDetails = await refreshJob(jobId)

      if (!isCurrent || isTerminalJobStatus(jobDetails?.status)) {
        return
      }

      timeoutId = window.setTimeout(poll, POLLING_INTERVAL_MS)
    }

    timeoutId = window.setTimeout(poll, POLLING_INTERVAL_MS)

    return () => {
      isCurrent = false

      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [activeJobId, activeJobStatus, refreshJob])
}
