import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../../metrics/metrics.service';
import {
  DEFAULT_JOB_URL_CONCURRENCY_LIMIT,
  JOB_URL_CONCURRENCY_LIMIT_ENV,
} from '../jobs.config';
import { JobsService } from '../jobs.service';

@Injectable()
export class JobsProcessorService {
  constructor(
    private readonly jobsService: JobsService,
    private readonly configService: ConfigService,
    @Optional() private readonly metricsService?: MetricsService,
  ) {}

  async process(jobId: string) {
    try {
      if (this.jobsService.isCancelled(jobId)) {
        return;
      }

      this.jobsService.updateJobStatus(jobId, 'in_progress');

      await this.processUrls(jobId);

      if (!this.jobsService.isCancelled(jobId)) {
        this.jobsService.updateJobStatus(jobId, 'completed');
      }
    } catch {
      const job = this.jobsService.findOne(jobId);

      if (job && job.status !== 'cancelled') {
        this.jobsService.updateJobStatus(jobId, 'failed');
      }
    }
  }

  private async processUrls(jobId: string) {
    const job = this.jobsService.findOneOrFail(jobId);
    const concurrencyLimit = this.getUrlConcurrencyLimit();
    const workerCount = Math.min(concurrencyLimit, job.urls.length);
    let nextUrlIndex = 0;

    this.metricsService?.setConfiguredConcurrencyLimit(concurrencyLimit);

    const workers = Array.from({ length: workerCount }, async () => {
      while (nextUrlIndex < job.urls.length) {
        if (this.jobsService.isCancelled(jobId)) {
          return;
        }

        const urlIndex = nextUrlIndex;
        nextUrlIndex += 1;

        await this.processUrl(jobId, urlIndex, job.urls[urlIndex].url);
      }
    });

    await Promise.all(workers);
  }

  private getUrlConcurrencyLimit() {
    const value = this.configService.get<string>(JOB_URL_CONCURRENCY_LIMIT_ENV);
    const parsedValue = Number(value);

    if (Number.isInteger(parsedValue) && parsedValue > 0) {
      return parsedValue;
    }

    return DEFAULT_JOB_URL_CONCURRENCY_LIMIT;
  }

  private async processUrl(jobId: string, urlIndex: number, url: string) {
    const urlCheck = this.jobsService.findOneOrFail(jobId).urls[urlIndex];

    if (this.jobsService.isCancelled(jobId) || urlCheck.status !== 'pending') {
      return;
    }

    const startedAt = new Date();
    let requestDurationMs = 0;

    this.jobsService.updateUrlCheck(jobId, urlIndex, {
      status: 'in_progress',
      startedAt: startedAt.toISOString(),
    });

    try {
      const requestStartedAt = Date.now();
      const response = await fetch(url, { method: 'HEAD' });
      requestDurationMs = Date.now() - requestStartedAt;
      const headResult =
        response.status >= 200 && response.status < 400
          ? 'success'
          : 'http_error';

      this.metricsService?.recordHeadRequest({
        result: headResult,
        httpStatus: response.status,
        durationMs: requestDurationMs,
      });

      const delayMs = await this.delayBeforeSavingResult();
      this.metricsService?.recordResultSaveDelay(delayMs);

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      if (response.status >= 200 && response.status < 400) {
        this.jobsService.updateUrlCheck(jobId, urlIndex, {
          status: 'success',
          httpStatus: response.status,
          finishedAt: finishedAt.toISOString(),
          durationMs,
        });
        this.metricsService?.recordUrlCheckFinished({
          result: 'success',
          httpStatus: response.status,
          durationMs,
        });

        return;
      }

      this.jobsService.updateUrlCheck(jobId, urlIndex, {
        status: 'error',
        httpStatus: response.status,
        errorMessage: `HTTP status ${response.status}`,
        finishedAt: finishedAt.toISOString(),
        durationMs,
      });
      this.metricsService?.recordUrlCheckFinished({
        result: 'error',
        httpStatus: response.status,
        durationMs,
      });
    } catch (error) {
      if (requestDurationMs === 0) {
        requestDurationMs = Date.now() - startedAt.getTime();
      }

      this.metricsService?.recordHeadRequest({
        result: 'request_error',
        durationMs: requestDurationMs,
      });

      const delayMs = await this.delayBeforeSavingResult();
      this.metricsService?.recordResultSaveDelay(delayMs);

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      this.jobsService.updateUrlCheck(jobId, urlIndex, {
        status: 'error',
        errorMessage: this.getErrorMessage(error),
        finishedAt: finishedAt.toISOString(),
        durationMs,
      });
      this.metricsService?.recordUrlCheckFinished({
        result: 'error',
        durationMs,
      });
    }
  }

  private delayBeforeSavingResult() {
    const delayMs = Math.floor(Math.random() * 10001);

    return new Promise<number>((resolve) => {
      setTimeout(() => resolve(delayMs), delayMs);
    });
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Request failed';
  }
}
