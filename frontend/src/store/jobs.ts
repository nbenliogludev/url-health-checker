import { create } from 'zustand'
import {
  createJob as createJobRequest,
  getApiErrorMessage,
  getJobs,
  type JobSummary,
} from '../api/jobs'

type JobsState = {
  jobs: JobSummary[]
  activeJobId: string | null
  isLoadingJobs: boolean
  jobsError: string | null
  isCreatingJob: boolean
  createError: string | null
  createdJobId: string | null
  loadJobs: () => Promise<void>
  selectJob: (jobId: string) => void
  createJob: (urls: string[]) => Promise<string | null>
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  activeJobId: null,
  isLoadingJobs: false,
  jobsError: null,
  isCreatingJob: false,
  createError: null,
  createdJobId: null,

  loadJobs: async () => {
    set({ isLoadingJobs: true, jobsError: null })

    try {
      const jobs = await getJobs()
      const currentActiveJobId = get().activeJobId
      const activeJobId =
        currentActiveJobId && jobs.some((job) => job.id === currentActiveJobId)
          ? currentActiveJobId
          : jobs[0]?.id ?? null

      set({ jobs, activeJobId, isLoadingJobs: false })
    } catch (error) {
      set({
        jobsError: getApiErrorMessage(error, 'Failed to load jobs'),
        isLoadingJobs: false,
      })
    }
  },

  selectJob: (jobId) => {
    set({ activeJobId: jobId })
  },

  createJob: async (urls) => {
    set({ isCreatingJob: true, createError: null, createdJobId: null })

    try {
      const result = await createJobRequest(urls)
      const jobs = await getJobs()

      set({
        jobs,
        activeJobId: result.jobId,
        createdJobId: result.jobId,
        isCreatingJob: false,
      })

      return result.jobId
    } catch (error) {
      set({
        createError: getApiErrorMessage(error, 'Failed to create job'),
        isCreatingJob: false,
      })

      return null
    }
  },
}))
