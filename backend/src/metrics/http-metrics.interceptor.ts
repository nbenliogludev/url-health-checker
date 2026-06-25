import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const startTime = process.hrtime.bigint();

    return next.handle().pipe(
      finalize(() => {
        const route = this.getRoute(request);

        if (route.endsWith('/metrics')) {
          return;
        }

        const durationSeconds =
          Number(process.hrtime.bigint() - startTime) / 1_000_000_000;

        this.metricsService.recordHttpRequest({
          method: request.method,
          route,
          statusCode: response.statusCode,
          durationSeconds,
        });
      }),
    );
  }

  private getRoute(request: FastifyRequest) {
    const requestWithRoute = request as FastifyRequest & {
      routeOptions?: {
        url?: string;
      };
      routerPath?: string;
    };

    return (
      requestWithRoute.routeOptions?.url ??
      requestWithRoute.routerPath ??
      request.url.split('?')[0]
    );
  }
}
