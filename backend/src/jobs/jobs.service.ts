import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateJobDto } from './dto/create-job.dto';
import { Job } from './job.types';

@Injectable()
export class JobsService {
  private readonly jobs = new Map<string, Job>();

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

    return { jobId: job.id };
  }

  findOne(id: string) {
    return this.jobs.get(id);
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
