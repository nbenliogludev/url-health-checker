import type { UrlCheck } from '../api/jobs'

export function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    timeStyle: 'medium',
  }).format(date)
}

export function formatUrlCheckTiming(
  item: Pick<UrlCheck, 'startedAt' | 'durationMs'>,
) {
  if (item.durationMs) {
    return `${item.durationMs} ms`
  }

  if (item.startedAt) {
    return formatTime(item.startedAt)
  }

  return 'Waiting'
}
