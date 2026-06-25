import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
})

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
