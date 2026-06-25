import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const dsn = process.env.SENTRY_DSN;

function getSampleRate(name: string, fallback: number) {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (Number.isFinite(parsedValue) && parsedValue >= 0 && parsedValue <= 1) {
    return parsedValue;
  }

  return fallback;
}

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE || undefined,
  tracesSampleRate: getSampleRate('SENTRY_TRACES_SAMPLE_RATE', 1),
  profilesSampleRate: getSampleRate('SENTRY_PROFILES_SAMPLE_RATE', 0),
  enableLogs: process.env.SENTRY_ENABLE_LOGS === 'true',
  sendDefaultPii: false,
  integrations: [nodeProfilingIntegration()],
});
