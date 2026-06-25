import { create } from 'zustand'
import {
  createJob as createJobRequest,
  getApiErrorMessage,
  getJobDetails,
  getJobs,
  type JobDetails,
  type JobSummary,
} from '../api/jobs'

type JobsState = {
  jobs: JobSummary[]
  activeJobId: string | null
  activeJobDetails: JobDetails | null
  isLoadingJobs: boolean
  isLoadingDetails: boolean
  jobsError: string | null
  detailsError: string | null
  isCreatingJob: boolean
  createError: string | null
  createdJobId: string | null
  loadJobs: () => Promise<void>
  loadJobDetails: (jobId: string) => Promise<void>
  selectJob: (jobId: string) => Promise<void>
  createJob: (urls: string[]) => Promise<string | null>
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  activeJobId: null,
  activeJobDetails: null,
  isLoadingJobs: false,
  isLoadingDetails: false,
  jobsError: null,
  detailsError: null,
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

      if (activeJobId) {
        await get().loadJobDetails(activeJobId)
      } else {
        set({ activeJobDetails: null })
      }
    } catch (error) {
      set({
        jobsError: getApiErrorMessage(error, 'Failed to load jobs'),
        isLoadingJobs: false,
      })
    }
  },

  loadJobDetails: async (jobId) => {
    set({
      activeJobDetails: null,
      isLoadingDetails: true,
      detailsError: null,
    })

    try {
      const activeJobDetails = await getJobDetails(jobId)

      set({ activeJobDetails, isLoadingDetails: false })
    } catch (error) {
      set({
        detailsError: getApiErrorMessage(error, 'Failed to load job details'),
        isLoadingDetails: false,
      })
    }
  },

  selectJob: async (jobId) => {
    set({ activeJobId: jobId })
    await get().loadJobDetails(jobId)
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

      await get().loadJobDetails(result.jobId)

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
