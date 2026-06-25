import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { randomUUID } from 'crypto';
import { MetricsService } from '../metrics/metrics.service';
import { CreateJobDto } from './dto/create-job.dto';
import { Job, JobStatus, JobSummary, UrlCheckUpdate } from './job.types';

@Injectable()
export class JobsService {
  private readonly jobs = new Map<string, Job>();

  constructor(@Optional() private readonly metricsService?: MetricsService) {}

  create(createJobDto: CreateJobDto) {
    const urls = this.validateUrls(createJobDto);
    const job: Job = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      urls: urls.map((url) => ({
        url,
        status: 'pending',
      })),
    };

    this.jobs.set(job.id, job);
    this.metricsService?.recordJobCreated(job.urls.length);
    Sentry.metrics.count('job.created', 1, {
      attributes: {
        url_count: job.urls.length,
      },
    });

    return { jobId: job.id };
  }

  findAll(): JobSummary[] {
    return Array.from(this.jobs.values())
      .reverse()
      .map((job) => this.toSummary(job));
  }

  findOne(id: string) {
    return this.jobs.get(id);
  }

  findOneOrFail(id: string) {
    const job = this.findOne(id);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  updateJobStatus(id: string, status: JobStatus) {
    const job = this.findOneOrFail(id);
    const previousStatus = job.status;

    job.status = status;
    this.metricsService?.recordJobStatusChange(previousStatus, status);

    if (status === 'completed' || status === 'cancelled' || status === 'failed') {
      Sentry.metrics.count('job.finished', 1, {
        attributes: {
          status,
        },
      });
    }

    return job;
  }

  cancel(id: string) {
    const job = this.updateJobStatus(id, 'cancelled');

    job.urls = job.urls.map((urlCheck) => {
      if (urlCheck.status !== 'pending') {
        return urlCheck;
      }

      this.metricsService?.recordUrlCheckStatusChange('pending', 'cancelled');
      this.metricsService?.recordUrlCheckFinished({
        result: 'cancelled',
      });

      return {
        ...urlCheck,
        status: 'cancelled',
      };
    });

    return job;
  }

  isCancelled(id: string) {
    return this.findOne(id)?.status === 'cancelled';
  }

  updateUrlCheck(jobId: string, urlIndex: number, update: UrlCheckUpdate) {
    const job = this.findOneOrFail(jobId);
    const urlCheck = job.urls[urlIndex];

    if (!urlCheck) {
      throw new NotFoundException('URL check not found');
    }

    const previousStatus = urlCheck.status;

    Object.assign(urlCheck, update);
    this.metricsService?.recordUrlCheckStatusChange(
      previousStatus,
      urlCheck.status,
    );

    return urlCheck;
  }

  private toSummary(job: Job): JobSummary {
    const stats = job.urls.reduce(
      (result, url) => {
        if (url.status === 'success') {
          result.success += 1;
        }

        if (url.status === 'error') {
          result.error += 1;
        }

        return result;
      },
      { success: 0, error: 0 },
    );

    return {
      id: job.id,
      createdAt: job.createdAt,
      status: job.status,
      totalUrls: job.urls.length,
      stats,
    };
  }

  private validateUrls(createJobDto: CreateJobDto) {
    if (!createJobDto || !Array.isArray(createJobDto.urls)) {
      throw new BadRequestException('urls must be an array');
    }

    if (createJobDto.urls.length === 0) {
      throw new BadRequestException('urls must contain at least one URL');
    }

    return createJobDto.urls.map((url, index) => this.validateUrl(url, index));
  }

  private validateUrl(value: unknown, index: number) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`urls[${index}] must be a string`);
    }

    const url = value.trim();

    if (!url) {
      throw new BadRequestException(`urls[${index}] must not be empty`);
    }

    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Unsupported protocol');
      }

      return parsedUrl.toString();
    } catch {
      throw new BadRequestException(`urls[${index}] must be a valid URL`);
    }
  }
}
