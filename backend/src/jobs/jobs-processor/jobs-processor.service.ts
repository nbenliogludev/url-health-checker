import { Injectable } from '@nestjs/common';
import { JobsService } from '../jobs.service';

@Injectable()
export class JobsProcessorService {
  constructor(private readonly jobsService: JobsService) {}

  async process(jobId: string) {
    try {
      this.jobsService.updateJobStatus(jobId, 'in_progress');
      const job = this.jobsService.findOneOrFail(jobId);

      for (const [index, urlCheck] of job.urls.entries()) {
        await this.processUrl(jobId, index, urlCheck.url);
      }

      this.jobsService.updateJobStatus(jobId, 'completed');
    } catch {
      const job = this.jobsService.findOne(jobId);

      if (job) {
        this.jobsService.updateJobStatus(jobId, 'failed');
      }
    }
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
