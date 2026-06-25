import type { JobStatus } from '../api/jobs'

export const TERMINAL_JOB_STATUSES: JobStatus[] = [
  'completed',
  'cancelled',
  'failed',
]

export function isTerminalJobStatus(status?: JobStatus) {
  return status ? TERMINAL_JOB_STATUSES.includes(status) : false
}
