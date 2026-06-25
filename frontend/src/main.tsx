import './instrument'
import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<main className="min-h-screen bg-[#f6f7f2] p-6 text-zinc-950">Something went wrong.</main>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
