import axios from 'axios'

const apiBaseUrl = getApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

const apiClient = axios.create({
  baseURL: apiBaseUrl,
})

function getApiBaseUrl(value?: string) {
  const baseUrl = value?.trim().replace(/\/+$/, '')

  if (!baseUrl) {
    return '/api'
  }

  if (baseUrl.endsWith('/api')) {
    return baseUrl
  }

  return `${baseUrl}/api`
}

export type JobStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type UrlCheckStatus =
  | 'pending'
  | 'in_progress'
  | 'success'
  | 'error'
  | 'cancelled'

export type JobSummary = {
  id: string
  createdAt: string
  status: JobStatus
  totalUrls: number
  stats: {
    success: number
    error: number
  }
}

export type UrlCheck = {
  url: string
  status: UrlCheckStatus
  httpStatus?: number
  errorMessage?: string
  startedAt?: string
  finishedAt?: string
  durationMs?: number
}

export type JobDetails = {
  id: string
  createdAt: string
  status: JobStatus
  urls: UrlCheck[]
}

type CreateJobResponse = {
  jobId: string
}

type ApiErrorResponse = {
  message?: string | string[]
}

export async function createJob(urls: string[]) {
  const { data } = await apiClient.post<CreateJobResponse>('/jobs', { urls })

  return data
}

export async function getJobs() {
  const { data } = await apiClient.get<JobSummary[]>('/jobs')

  return data
}

export async function getJobDetails(jobId: string) {
  const { data } = await apiClient.get<JobDetails>(`/jobs/${jobId}`)

  return data
}

export async function cancelJob(jobId: string) {
  const { data } = await apiClient.delete<JobDetails>(`/jobs/${jobId}`)

  return data
}

export function getApiErrorMessage(error: unknown, fallback = 'Request failed') {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message

    if (Array.isArray(message)) {
      return message.join(', ')
    }

    if (message) {
      return message
    }
  }

  return fallback
}
