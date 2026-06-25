import { FastifyReply } from 'fastify';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  it('returns metrics with Prometheus content type', async () => {
    const metricsService = {
      contentType: 'text/plain; version=0.0.4; charset=utf-8',
      getMetrics: jest.fn().mockResolvedValue('metrics'),
    };
    const response = {
      header: jest.fn(),
    };
    const controller = new MetricsController(
      metricsService as unknown as MetricsService,
    );

    await expect(
      controller.getMetrics(response as unknown as FastifyReply),
    ).resolves.toBe('metrics');
    expect(response.header).toHaveBeenCalledWith(
      'Content-Type',
      metricsService.contentType,
    );
  });
});
