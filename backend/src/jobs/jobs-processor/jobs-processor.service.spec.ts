import { Test, TestingModule } from '@nestjs/testing';
import { JobsProcessorService } from './jobs-processor.service';

describe('JobsProcessorService', () => {
  let service: JobsProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsProcessorService],
    }).compile();

    service = module.get<JobsProcessorService>(JobsProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
