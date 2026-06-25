import * as Sentry from '@sentry/react'
import { create } from 'zustand'
import {
  cancelJob as cancelJobRequest,
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
  isCancellingJob: boolean
  createError: string | null
  cancelError: string | null
  createdJobId: string | null
  loadJobs: () => Promise<void>
  loadJobDetails: (jobId: string) => Promise<void>
  refreshJob: (jobId: string) => Promise<JobDetails | null>
  selectJob: (jobId: string) => Promise<void>
  createJob: (urls: string[]) => Promise<string | null>
  cancelJob: (jobId: string) => Promise<JobDetails | null>
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
  isCancellingJob: false,
  createError: null,
  cancelError: null,
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
      Sentry.captureException(error)
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

      if (get().activeJobId !== jobId) {
        return
      }

      set({ activeJobDetails, isLoadingDetails: false })
    } catch (error) {
      if (get().activeJobId !== jobId) {
        return
      }

      Sentry.captureException(error)
      set({
        detailsError: getApiErrorMessage(error, 'Failed to load job details'),
        isLoadingDetails: false,
      })
    }
  },

  refreshJob: async (jobId) => {
    try {
      const [jobs, activeJobDetails] = await Promise.all([
        getJobs(),
        getJobDetails(jobId),
      ])

      if (get().activeJobId !== jobId) {
        return null
      }

      set({
        jobs,
        activeJobDetails,
        jobsError: null,
        detailsError: null,
      })

      return activeJobDetails
    } catch (error) {
      if (get().activeJobId !== jobId) {
        return null
      }

      Sentry.captureException(error)
      set({
        detailsError: getApiErrorMessage(error, 'Failed to refresh job'),
      })

      return null
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
      Sentry.metrics.count('job.created', 1, {
        attributes: {
          url_count: urls.length,
        },
      })

      await get().loadJobDetails(result.jobId)

      return result.jobId
    } catch (error) {
      Sentry.captureException(error)
      set({
        createError: getApiErrorMessage(error, 'Failed to create job'),
        isCreatingJob: false,
      })

      return null
    }
  },

  cancelJob: async (jobId) => {
    set({ isCancellingJob: true, cancelError: null })

    try {
      const activeJobDetails = await cancelJobRequest(jobId)
      const jobs = await getJobs()

      if (get().activeJobId !== jobId) {
        set({ jobs, isCancellingJob: false })
        return activeJobDetails
      }

      set({
        jobs,
        activeJobDetails,
        isCancellingJob: false,
        detailsError: null,
      })
      Sentry.metrics.count('job.cancelled', 1)

      return activeJobDetails
    } catch (error) {
      Sentry.captureException(error)
      set({
        cancelError: getApiErrorMessage(error, 'Failed to cancel job'),
        isCancellingJob: false,
      })

      return null
    }
  },
}))
