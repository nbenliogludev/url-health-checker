import { Injectable } from '@nestjs/common';
import { JobsService } from '../jobs.service';

@Injectable()
export class JobsProcessorService {
  constructor(private readonly jobsService: JobsService) {}

  process(jobId: string) {
    try {
      this.jobsService.updateJobStatus(jobId, 'in_progress');
      this.jobsService.findOneOrFail(jobId);
      this.jobsService.updateJobStatus(jobId, 'completed');
    } catch {
      const job = this.jobsService.findOne(jobId);

      if (job) {
        this.jobsService.updateJobStatus(jobId, 'failed');
      }
    }
  }
}
