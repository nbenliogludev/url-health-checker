import { ConfigService } from '@nestjs/config';
import { JobsService } from '../jobs.service';
import { JobsProcessorService } from './jobs-processor.service';

describe('JobsProcessorService', () => {
  let service: JobsProcessorService;
  let jobsService: JobsService;
  let configService: { get: jest.Mock };

  beforeEach(() => {
    jobsService = new JobsService();
    configService = {
      get: jest.fn(),
    };
    service = new JobsProcessorService(
      jobsService,
      configService as unknown as ConfigService,
    );

    jest
      .spyOn(service as any, 'delayBeforeSavingResult')
      .mockResolvedValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('marks successful and failed HEAD checks and completes the job', async () => {
    const result = jobsService.create({
      urls: ['https://example.com/success', 'https://example.com/not-found'],
    });

    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({ status: 200 } as Response)
      .mockResolvedValueOnce({ status: 404 } as Response);

    await service.process(result.jobId);

    const job = jobsService.findOneOrFail(result.jobId);

    expect(job.status).toBe('completed');
    expect(job.urls).toEqual([
      expect.objectContaining({
        status: 'success',
        httpStatus: 200,
        startedAt: expect.any(String),
        finishedAt: expect.any(String),
        durationMs: expect.any(Number),
      }),
      expect.objectContaining({
        status: 'error',
        httpStatus: 404,
        errorMessage: 'HTTP status 404',
        startedAt: expect.any(String),
        finishedAt: expect.any(String),
        durationMs: expect.any(Number),
      }),
    ]);
  });

  it('stores fetch errors on the URL check and still completes the job', async () => {
    const result = jobsService.create({
      urls: ['https://broken.example'],
    });

    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));

    await service.process(result.jobId);

    const job = jobsService.findOneOrFail(result.jobId);

    expect(job.status).toBe('completed');
    expect(job.urls[0]).toEqual(
      expect.objectContaining({
        status: 'error',
        errorMessage: 'network down',
      }),
    );
  });

  it('does not exceed the configured per-job concurrency limit', async () => {
    configService.get.mockReturnValue('2');
    let inFlight = 0;
    let maxInFlight = 0;

    jest.spyOn(global, 'fetch').mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);

      await new Promise((resolve) => setTimeout(resolve, 10));

      inFlight -= 1;

      return { status: 200 } as Response;
    });

    const result = jobsService.create({
      urls: Array.from(
        { length: 7 },
        (_, index) => `https://example.com/${index}`,
      ),
    });

    await service.process(result.jobId);

    expect(maxInFlight).toBeLessThanOrEqual(2);
    expect(global.fetch).toHaveBeenCalledTimes(7);
    expect(jobsService.findOneOrFail(result.jobId).status).toBe('completed');
  });

  it('stops assigning not-started URLs when a job is cancelled', async () => {
    configService.get.mockReturnValue('3');
    let jobId = '';

    jest.spyOn(global, 'fetch').mockImplementation(async () => {
      jobsService.cancel(jobId);

      return { status: 200 } as Response;
    });

    const result = jobsService.create({
      urls: [
        'https://example.com/one',
        'https://example.com/two',
        'https://example.com/three',
      ],
    });
    jobId = result.jobId;

    await service.process(jobId);

    const job = jobsService.findOneOrFail(jobId);

    expect(job.status).toBe('cancelled');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(job.urls.map((urlCheck) => urlCheck.status)).toEqual([
      'success',
      'cancelled',
      'cancelled',
    ]);
  });

  it('does not restart a job that was cancelled before processing started', async () => {
    const result = jobsService.create({
      urls: ['https://example.com/one', 'https://example.com/two'],
    });

    jobsService.cancel(result.jobId);

    const fetchMock = jest.spyOn(global, 'fetch');

    await service.process(result.jobId);

    const job = jobsService.findOneOrFail(result.jobId);

    expect(job.status).toBe('cancelled');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(job.urls.map((urlCheck) => urlCheck.status)).toEqual([
      'cancelled',
      'cancelled',
    ]);
  });
});
