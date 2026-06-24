import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JobsService } from '../jobs.service';
import { JobsProcessorService } from './jobs-processor.service';

describe('JobsProcessorService', () => {
  let service: JobsProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsProcessorService, JobsService, ConfigService],
    }).compile();

    service = module.get<JobsProcessorService>(JobsProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
