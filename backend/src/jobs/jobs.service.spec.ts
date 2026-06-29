import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsService],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a pending job with normalized URL checks', () => {
    const result = service.create({
      urls: [' https://example.com ', 'http://example.org/path'],
    });

    const job = service.findOneOrFail(result.jobId);

    expect(job.status).toBe('pending');
    expect(job.urls).toEqual([
      {
        url: 'https://example.com/',
        status: 'pending',
      },
      {
        url: 'http://example.org/path',
        status: 'pending',
      },
    ]);
  });

  it('rejects invalid URL payloads', () => {
    expect(() => service.create({ urls: [] })).toThrow(BadRequestException);
    expect(() =>
      service.create({ urls: ['ftp://example.com'] }),
    ).toThrow(BadRequestException);
    expect(() =>
      service.create({ urls: ['not-a-url'] }),
    ).toThrow(BadRequestException);
    expect(() =>
      service.create({ urls: Array(1001).fill('https://example.com') }),
    ).toThrow(BadRequestException);
  });

  it('returns summaries in newest-first order with success and error stats', () => {
    const first = service.create({ urls: ['https://first.example'] });
    const second = service.create({
      urls: ['https://second.example/success', 'https://second.example/error'],
    });

    service.updateJobStatus(first.jobId, 'completed');
    service.updateUrlCheck(first.jobId, 0, { status: 'success' });
    service.updateJobStatus(second.jobId, 'completed');
    service.updateUrlCheck(second.jobId, 0, { status: 'success' });
    service.updateUrlCheck(second.jobId, 1, { status: 'error' });

    expect(service.findAll()).toEqual([
      expect.objectContaining({
        id: second.jobId,
        status: 'completed',
        totalUrls: 2,
        stats: { success: 1, error: 1 },
      }),
      expect.objectContaining({
        id: first.jobId,
        status: 'completed',
        totalUrls: 1,
        stats: { success: 1, error: 0 },
      }),
    ]);
  });

  it('cancels only URL checks that have not started yet', () => {
    const result = service.create({
      urls: [
        'https://example.com/one',
        'https://example.com/two',
        'https://example.com/three',
      ],
    });

    service.updateUrlCheck(result.jobId, 0, { status: 'in_progress' });
    service.updateUrlCheck(result.jobId, 1, { status: 'success' });

    const job = service.cancel(result.jobId);

    expect(job.status).toBe('cancelled');
    expect(job.urls.map((urlCheck) => urlCheck.status)).toEqual([
      'in_progress',
      'success',
      'cancelled',
    ]);
  });

  it('throws when updating a missing URL check', () => {
    const result = service.create({ urls: ['https://example.com'] });

    expect(() =>
      service.updateUrlCheck(result.jobId, 5, { status: 'success' }),
    ).toThrow(NotFoundException);
  });

  it('cleans up old terminal jobs to prevent memory leaks', () => {
    const pendingJobIds: string[] = [];
    for (let i = 0; i < 102; i++) {
      pendingJobIds.push(service.create({ urls: ['https://example.com'] }).jobId);
    }

    for (let i = 0; i < 5; i++) {
      service.updateJobStatus(pendingJobIds[i], 'completed');
    }
    
    service.create({ urls: ['https://example.com'] });
    
    const allJobs = service.findAll();
    expect(allJobs.length).toBe(100);
    
    expect(service.findOne(pendingJobIds[0])).toBeUndefined();
    expect(service.findOne(pendingJobIds[1])).toBeUndefined();
    expect(service.findOne(pendingJobIds[2])).toBeUndefined();
    
    expect(service.findOne(pendingJobIds[3])).toBeDefined();
    expect(service.findOne(pendingJobIds[4])).toBeDefined();
  });
});
