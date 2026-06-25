import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

function getSampleRate(name: string, fallback: number) {
  const value = import.meta.env[name]

  if (!value) {
    return fallback
  }

  const parsedValue = Number(value)

  if (Number.isFinite(parsedValue) && parsedValue >= 0 && parsedValue <= 1) {
    return parsedValue
  }

  return fallback
}

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
  release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: getSampleRate('VITE_SENTRY_TRACES_SAMPLE_RATE', 1),
  tracePropagationTargets: [/^\/api/, /^http:\/\/localhost:3000\/api/],
  replaysSessionSampleRate: getSampleRate(
    'VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE',
    0,
  ),
  replaysOnErrorSampleRate: getSampleRate(
    'VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE',
    1,
  ),
});
