# URL Health Checker

Fullstack app for asynchronous URL checks. It lets you create background jobs from URL lists, track progress, review results, and cancel running checks.

## What It Can Do

- Create a job from a list of URLs.
- Process URL checks asynchronously in the background.
- Limit concurrent URL checks per job.
- Show all jobs with status and success/error stats.
- Show detailed status for every URL in a job.
- Cancel a job and skip URLs that have not started yet.
- Expose Swagger docs for the API.
- Expose Prometheus metrics.
- Show a ready-to-use Grafana dashboard.
- Send backend and frontend errors to Sentry.

Data is stored in memory, so jobs are reset after the backend restarts.

## Screenshots

### Frontend

![Frontend](docs/front.png)

### Grafana

![Grafana dashboard](docs/grafana.png)

### Sentry

![Sentry issues](docs/sentry.png)

## Project Structure

```text
backend/        NestJS API and background job processing
frontend/       React app
observability/  Prometheus and Grafana config
docs/           Screenshots for README
```

## Tech Stack

- Backend: NestJS, Fastify, TypeScript
- Frontend: React, TypeScript, Vite, Tailwind CSS, Zustand
- API client: Axios
- Observability: Prometheus, Grafana, Sentry
- Runtime: Docker and Docker Compose

## Run With Docker

The easiest way to run the whole project is Docker Compose.

```bash
docker compose up --build
```

After startup:

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| Backend metrics | http://localhost:3000/api/metrics |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3002 |
| Grafana dashboard | http://localhost:3002/d/url-health-checker/url-health-checker?orgId=1 |

Grafana credentials:

```text
admin / admin
```

To stop everything:

```bash
docker compose down
```

## Environment

Sentry is optional. The app works without it.

For Docker, copy the root example file and adjust values if needed:

```bash
cp .env.example .env
```

Main variables:

| Variable | Description |
| --- | --- |
| `SENTRY_DSN` | Backend Sentry DSN |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN |
| `JOB_URL_CONCURRENCY_LIMIT` | How many URLs can be checked at the same time inside one job. Default is `5`. |

If `JOB_URL_CONCURRENCY_LIMIT=10`, one job can process up to 10 URLs in parallel. Several jobs can still run at the same time.

## Manual Run

If you want to run the apps without Docker, start the backend and frontend in separate terminals.

Backend:

```bash
cd backend
npm install
npm run start:dev
```

The backend will run on:

```text
http://localhost:3000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on:

```text
http://localhost:5173
```

In development mode, Vite proxies `/api` requests to the backend.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/jobs` | Create a new URL check job |
| `GET` | `/api/jobs` | Get recent jobs with short stats |
| `GET` | `/api/jobs/:id` | Get full job details |
| `DELETE` | `/api/jobs/:id` | Cancel a job |
| `GET` | `/api/metrics` | Prometheus metrics |

Create job example:

```json
{
  "urls": [
    "https://example.com",
    "https://github.com"
  ]
}
```

Response:

```json
{
  "jobId": "..."
}
```

## How URL Checks Work

For each URL the backend sends an HTTP `HEAD` request.

Before saving the result, it waits for a random delay from 0 to 10 seconds. This makes the async job flow visible in the UI.

Each job has its own concurrency limit. By default, up to 5 URL checks can run at the same time for one job.

## Observability

Prometheus scrapes backend metrics from:

```text
http://localhost:3000/api/metrics
```

Grafana starts with a preconfigured dashboard:

```text
http://localhost:3002/d/url-health-checker/url-health-checker?orgId=1
```

The dashboard shows job counters, URL check results, request latency, processing time, and API metrics.

Sentry is connected separately for backend and frontend. It is useful for checking real errors, stack traces, request context, and where the issue happened.

The most useful Sentry page for this project is:

```text
Issues -> Feed
```

## Tests

Backend:

```bash
cd backend
npm test
npm run test:e2e
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```
