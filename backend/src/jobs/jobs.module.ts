import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsProcessorService } from './jobs-processor/jobs-processor.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, JobsProcessorService],
})
export class JobsModule {}
