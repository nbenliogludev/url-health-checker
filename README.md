# URL Health Checker

## Docker

Run the app:

```bash
docker compose up --build
```

Frontend:

```text
http://localhost:5173
```

Backend API:

```text
http://localhost:3000/api
```

Swagger:

```text
http://localhost:3000/api/docs
```

Prometheus metrics:

```text
http://localhost:3000/api/metrics
```

Prometheus:

```text
http://localhost:9090
```

Grafana:

```text
http://localhost:3002
```

Default Grafana credentials:

```text
admin / admin
```

The Docker setup also starts Prometheus and Grafana. Prometheus scrapes backend metrics from `/api/metrics`, and Grafana provisions a ready-to-use `URL Health Checker` dashboard automatically.

Tracked metrics include:

- jobs created, finished and grouped by status
- submitted URLs and URL checks grouped by status
- URL check results and duration
- outbound HEAD request count and latency
- artificial result save delay
- API request count and latency
- configured per-job URL concurrency limit

## Sentry

Sentry is optional. Copy `.env.example` to `.env` and set project DSNs:

```text
SENTRY_DSN=...
VITE_SENTRY_DSN=...
```

Backend uses `@sentry/nestjs` for error monitoring, tracing and background job isolation. Frontend uses `@sentry/react` for browser errors, tracing and session replay.
