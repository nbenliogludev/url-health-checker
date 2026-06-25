import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../app.module';
import { JobsProcessorService } from './jobs-processor/jobs-processor.service';

describe('Jobs API (e2e)', () => {
  let app: NestFastifyApplication;
  let processor: { process: jest.Mock };

  beforeEach(async () => {
    processor = {
      process: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(JobsProcessorService)
      .useValue(processor)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates, lists, reads and cancels a job', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/jobs',
      headers: {
        'content-type': 'application/json',
      },
      payload: {
        urls: ['https://example.com', 'https://github.com'],
      },
    });
    const createBody = createResponse.json<{ jobId: string }>();

    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(createResponse.statusCode).toBe(201);
    expect(createBody.jobId).toEqual(expect.any(String));
    expect(processor.process).toHaveBeenCalledWith(createBody.jobId);

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/jobs',
    });
    const listBody = listResponse.json();

    expect(listResponse.statusCode).toBe(200);
    expect(listBody).toEqual([
      expect.objectContaining({
        id: createBody.jobId,
        status: 'pending',
        totalUrls: 2,
        stats: { success: 0, error: 0 },
      }),
    ]);

    const detailsResponse = await app.inject({
      method: 'GET',
      url: `/api/jobs/${createBody.jobId}`,
    });
    const detailsBody = detailsResponse.json();

    expect(detailsResponse.statusCode).toBe(200);
    expect(detailsBody).toEqual(
      expect.objectContaining({
        id: createBody.jobId,
        status: 'pending',
        urls: [
          { url: 'https://example.com/', status: 'pending' },
          { url: 'https://github.com/', status: 'pending' },
        ],
      }),
    );

    const cancelResponse = await app.inject({
      method: 'DELETE',
      url: `/api/jobs/${createBody.jobId}`,
    });
    const cancelBody = cancelResponse.json();

    expect(cancelResponse.statusCode).toBe(200);
    expect(cancelBody).toEqual(
      expect.objectContaining({
        id: createBody.jobId,
        status: 'cancelled',
        urls: [
          { url: 'https://example.com/', status: 'cancelled' },
          { url: 'https://github.com/', status: 'cancelled' },
        ],
      }),
    );

    const metricsResponse = await app.inject({
      method: 'GET',
      url: '/api/metrics',
    });

    expect(metricsResponse.statusCode).toBe(200);
    expect(metricsResponse.headers['content-type']).toContain('text/plain');
    expect(metricsResponse.body).toContain(
      'url_health_checker_jobs_created_total',
    );
    expect(metricsResponse.body).toContain(
      'url_health_checker_jobs_finished_total',
    );
  });

  it('returns validation and not found errors', async () => {
    const invalidCreateResponse = await app.inject({
      method: 'POST',
      url: '/api/jobs',
      headers: {
        'content-type': 'application/json',
      },
      payload: {
        urls: ['ftp://example.com'],
      },
    });

    expect(invalidCreateResponse.statusCode).toBe(400);

    const missingJobResponse = await app.inject({
      method: 'GET',
      url: '/api/jobs/missing-job',
    });

    expect(missingJobResponse.statusCode).toBe(404);
  });
});
