import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
})

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

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message

    if (Array.isArray(message)) {
      return message.join(', ')
    }

    if (message) {
      return message
    }
  }

  return 'Failed to create job'
}
