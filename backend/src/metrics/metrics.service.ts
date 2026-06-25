import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';
import type { JobStatus, UrlCheckStatus } from '../jobs/job.types';

const METRIC_PREFIX = 'url_health_checker_';
const SERVICE_NAME = 'url-health-checker-backend';
const JOB_STATUSES: JobStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'failed',
];
const URL_CHECK_STATUSES: UrlCheckStatus[] = [
  'pending',
  'in_progress',
  'success',
  'error',
  'cancelled',
];
const TERMINAL_JOB_STATUSES: JobStatus[] = [
  'completed',
  'cancelled',
  'failed',
];

interface HttpRequestMetric {
  method: string;
  route: string;
  statusCode: number;
  durationSeconds: number;
}

interface UrlCheckFinishedMetric {
  result: 'success' | 'error' | 'cancelled';
  httpStatus?: number;
  durationMs?: number;
}

interface HeadRequestMetric {
  result: 'success' | 'http_error' | 'request_error';
  httpStatus?: number;
  durationMs: number;
}

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly jobsCreatedTotal: Counter;
  private readonly jobsFinishedTotal: Counter;
  private readonly jobStatusChangesTotal: Counter;
  private readonly jobUrlsSubmittedTotal: Counter;
  private readonly jobsByStatus: Gauge;
  private readonly urlChecksByStatus: Gauge;
  private readonly urlCheckStatusChangesTotal: Counter;
  private readonly urlChecksStartedTotal: Counter;
  private readonly urlChecksFinishedTotal: Counter;
  private readonly urlCheckDurationSeconds: Histogram;
  private readonly headRequestsTotal: Counter;
  private readonly headRequestDurationSeconds: Histogram;
  private readonly resultSaveDelaySeconds: Histogram;
  private readonly httpRequestsTotal: Counter;
  private readonly httpRequestDurationSeconds: Histogram;
  private readonly configuredConcurrencyLimit: Gauge;

  constructor() {
    this.registry.setDefaultLabels({
      service: SERVICE_NAME,
    });

    collectDefaultMetrics({
      prefix: METRIC_PREFIX,
      register: this.registry,
    });

    this.jobsCreatedTotal = new Counter({
      name: `${METRIC_PREFIX}jobs_created_total`,
      help: 'Total number of created URL check jobs.',
      registers: [this.registry],
    });
    this.jobsFinishedTotal = new Counter({
      name: `${METRIC_PREFIX}jobs_finished_total`,
      help: 'Total number of jobs that reached a terminal status.',
      labelNames: ['status'],
      registers: [this.registry],
    });
    this.jobStatusChangesTotal = new Counter({
      name: `${METRIC_PREFIX}job_status_changes_total`,
      help: 'Total number of job status changes.',
      labelNames: ['status'],
      registers: [this.registry],
    });
    this.jobUrlsSubmittedTotal = new Counter({
      name: `${METRIC_PREFIX}job_urls_submitted_total`,
      help: 'Total number of URLs submitted in jobs.',
      registers: [this.registry],
    });
    this.jobsByStatus = new Gauge({
      name: `${METRIC_PREFIX}jobs_by_status`,
      help: 'Current number of jobs by status.',
      labelNames: ['status'],
      registers: [this.registry],
    });
    this.urlChecksByStatus = new Gauge({
      name: `${METRIC_PREFIX}url_checks_by_status`,
      help: 'Current number of URL checks by status.',
      labelNames: ['status'],
      registers: [this.registry],
    });
    this.urlCheckStatusChangesTotal = new Counter({
      name: `${METRIC_PREFIX}url_check_status_changes_total`,
      help: 'Total number of URL check status changes.',
      labelNames: ['status'],
      registers: [this.registry],
    });
    this.urlChecksStartedTotal = new Counter({
      name: `${METRIC_PREFIX}url_checks_started_total`,
      help: 'Total number of URL checks that started processing.',
      registers: [this.registry],
    });
    this.urlChecksFinishedTotal = new Counter({
      name: `${METRIC_PREFIX}url_checks_finished_total`,
      help: 'Total number of finished URL checks by result.',
      labelNames: ['result', 'http_status_class'],
      registers: [this.registry],
    });
    this.urlCheckDurationSeconds = new Histogram({
      name: `${METRIC_PREFIX}url_check_duration_seconds`,
      help: 'URL check duration including the artificial result save delay.',
      labelNames: ['result', 'http_status_class'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 15, 30],
      registers: [this.registry],
    });
    this.headRequestsTotal = new Counter({
      name: `${METRIC_PREFIX}head_requests_total`,
      help: 'Total number of outbound HTTP HEAD requests.',
      labelNames: ['result', 'http_status_class'],
      registers: [this.registry],
    });
    this.headRequestDurationSeconds = new Histogram({
      name: `${METRIC_PREFIX}head_request_duration_seconds`,
      help: 'Outbound HTTP HEAD request duration.',
      labelNames: ['result', 'http_status_class'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });
    this.resultSaveDelaySeconds = new Histogram({
      name: `${METRIC_PREFIX}result_save_delay_seconds`,
      help: 'Artificial delay before saving a URL check result.',
      buckets: [0.5, 1, 2, 5, 10, 11],
      registers: [this.registry],
    });
    this.httpRequestsTotal = new Counter({
      name: `${METRIC_PREFIX}http_requests_total`,
      help: 'Total number of incoming HTTP API requests.',
      labelNames: ['method', 'route', 'status_code', 'status_class'],
      registers: [this.registry],
    });
    this.httpRequestDurationSeconds = new Histogram({
      name: `${METRIC_PREFIX}http_request_duration_seconds`,
      help: 'Incoming HTTP API request duration.',
      labelNames: ['method', 'route', 'status_code', 'status_class'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
      registers: [this.registry],
    });
    this.configuredConcurrencyLimit = new Gauge({
      name: `${METRIC_PREFIX}configured_url_concurrency_limit`,
      help: 'Configured per-job URL processing concurrency limit.',
      registers: [this.registry],
    });

    this.initializeMetricLabels();
  }

  get contentType() {
    return this.registry.contentType;
  }

  getMetrics() {
    return this.registry.metrics();
  }

  recordJobCreated(urlCount: number) {
    this.jobsCreatedTotal.inc();
    this.jobUrlsSubmittedTotal.inc(urlCount);
    this.jobsByStatus.labels('pending').inc();
    this.urlChecksByStatus.labels('pending').inc(urlCount);
  }

  recordJobStatusChange(previousStatus: JobStatus, nextStatus: JobStatus) {
    if (previousStatus === nextStatus) {
      return;
    }

    this.jobsByStatus.labels(previousStatus).dec();
    this.jobsByStatus.labels(nextStatus).inc();
    this.jobStatusChangesTotal.labels(nextStatus).inc();

    if (TERMINAL_JOB_STATUSES.includes(nextStatus)) {
      this.jobsFinishedTotal.labels(nextStatus).inc();
    }
  }

  recordUrlCheckStatusChange(
    previousStatus: UrlCheckStatus,
    nextStatus: UrlCheckStatus,
  ) {
    if (previousStatus === nextStatus) {
      return;
    }

    this.urlChecksByStatus.labels(previousStatus).dec();
    this.urlChecksByStatus.labels(nextStatus).inc();
    this.urlCheckStatusChangesTotal.labels(nextStatus).inc();

    if (nextStatus === 'in_progress') {
      this.urlChecksStartedTotal.inc();
    }
  }

  recordUrlCheckFinished(metric: UrlCheckFinishedMetric) {
    const httpStatusClass = this.getHttpStatusClass(metric.httpStatus);

    this.urlChecksFinishedTotal.labels(metric.result, httpStatusClass).inc();

    if (metric.durationMs !== undefined) {
      this.urlCheckDurationSeconds
        .labels(metric.result, httpStatusClass)
        .observe(metric.durationMs / 1000);
    }
  }

  recordHeadRequest(metric: HeadRequestMetric) {
    const httpStatusClass = this.getHttpStatusClass(metric.httpStatus);

    this.headRequestsTotal.labels(metric.result, httpStatusClass).inc();
    this.headRequestDurationSeconds
      .labels(metric.result, httpStatusClass)
      .observe(metric.durationMs / 1000);
  }

  recordResultSaveDelay(delayMs: number) {
    this.resultSaveDelaySeconds.observe(delayMs / 1000);
  }

  recordHttpRequest(metric: HttpRequestMetric) {
    const method = metric.method.toUpperCase();
    const statusCode = String(metric.statusCode);
    const statusClass = this.getHttpStatusClass(metric.statusCode);

    this.httpRequestsTotal
      .labels(method, metric.route, statusCode, statusClass)
      .inc();
    this.httpRequestDurationSeconds
      .labels(method, metric.route, statusCode, statusClass)
      .observe(metric.durationSeconds);
  }

  setConfiguredConcurrencyLimit(limit: number) {
    this.configuredConcurrencyLimit.set(limit);
  }

  private initializeMetricLabels() {
    JOB_STATUSES.forEach((status) => {
      this.jobsByStatus.labels(status).set(0);
      this.jobStatusChangesTotal.labels(status).inc(0);
      this.jobsFinishedTotal.labels(status).inc(0);
    });

    URL_CHECK_STATUSES.forEach((status) => {
      this.urlChecksByStatus.labels(status).set(0);
      this.urlCheckStatusChangesTotal.labels(status).inc(0);
    });

    ['success', 'error', 'cancelled'].forEach((result) => {
      ['none', '2xx', '3xx', '4xx', '5xx'].forEach((statusClass) => {
        this.urlChecksFinishedTotal.labels(result, statusClass).inc(0);
      });
    });

    ['success', 'http_error', 'request_error'].forEach((result) => {
      ['none', '2xx', '3xx', '4xx', '5xx'].forEach((statusClass) => {
        this.headRequestsTotal.labels(result, statusClass).inc(0);
      });
    });
  }

  private getHttpStatusClass(statusCode?: number) {
    if (!statusCode) {
      return 'none';
    }

    return `${Math.floor(statusCode / 100)}xx`;
  }
}
