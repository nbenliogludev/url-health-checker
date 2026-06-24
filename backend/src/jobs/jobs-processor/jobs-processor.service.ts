import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  ) {}

  async process(jobId: string) {
    try {
      this.jobsService.updateJobStatus(jobId, 'in_progress');

      await this.processUrls(jobId);

      this.jobsService.updateJobStatus(jobId, 'completed');
    } catch {
      const job = this.jobsService.findOne(jobId);

      if (job) {
        this.jobsService.updateJobStatus(jobId, 'failed');
      }
    }
  }

  private async processUrls(jobId: string) {
    const job = this.jobsService.findOneOrFail(jobId);
    const workerCount = Math.min(
      this.getUrlConcurrencyLimit(),
      job.urls.length,
    );
    let nextUrlIndex = 0;

    const workers = Array.from({ length: workerCount }, async () => {
      while (nextUrlIndex < job.urls.length) {
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
    const startedAt = new Date();

    this.jobsService.updateUrlCheck(jobId, urlIndex, {
      status: 'in_progress',
      startedAt: startedAt.toISOString(),
    });

    try {
      const response = await fetch(url, { method: 'HEAD' });

      await this.delayBeforeSavingResult();

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      if (response.status >= 200 && response.status < 400) {
        this.jobsService.updateUrlCheck(jobId, urlIndex, {
          status: 'success',
          httpStatus: response.status,
          finishedAt: finishedAt.toISOString(),
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
    } catch (error) {
      await this.delayBeforeSavingResult();

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      this.jobsService.updateUrlCheck(jobId, urlIndex, {
        status: 'error',
        errorMessage: this.getErrorMessage(error),
        finishedAt: finishedAt.toISOString(),
        durationMs,
      });
    }
  }

  private delayBeforeSavingResult() {
    const delayMs = Math.floor(Math.random() * 10001);

    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Request failed';
  }
}
