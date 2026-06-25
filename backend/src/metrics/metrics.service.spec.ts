import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  it('exports created jobs and URL check metrics', async () => {
    service.recordJobCreated(2);
    service.recordJobStatusChange('pending', 'in_progress');
    service.recordUrlCheckStatusChange('pending', 'in_progress');
    service.recordHeadRequest({
      result: 'success',
      httpStatus: 200,
      durationMs: 120,
    });
    service.recordResultSaveDelay(500);
    service.recordUrlCheckFinished({
      result: 'success',
      httpStatus: 200,
      durationMs: 620,
    });
    service.recordHttpRequest({
      method: 'post',
      route: '/api/jobs',
      statusCode: 201,
      durationSeconds: 0.05,
    });

    const metrics = await service.getMetrics();

    expect(metrics).toContain('url_health_checker_jobs_created_total');
    expect(metrics).toContain('url_health_checker_job_urls_submitted_total');
    expect(metrics).toContain('url_health_checker_jobs_by_status');
    expect(metrics).toContain('url_health_checker_url_checks_finished_total');
    expect(metrics).toContain('url_health_checker_head_requests_total');
    expect(metrics).toContain('url_health_checker_http_requests_total');
  });
});
