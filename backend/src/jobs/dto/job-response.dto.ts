import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus, UrlCheckStatus } from '../job.types';

export class CreateJobResponseDto {
  @ApiProperty({
    description: 'Created job id',
    example: 'f2f7d2f1-236b-4b84-94c7-a7703acb7f35',
  })
  jobId!: string;
}

export class JobStatsDto {
  @ApiProperty({
    description: 'Number of successfully checked URLs',
    example: 2,
  })
  success!: number;

  @ApiProperty({
    description: 'Number of URLs finished with errors',
    example: 1,
  })
  error!: number;
}

export class JobSummaryDto {
  @ApiProperty({
    example: 'f2f7d2f1-236b-4b84-94c7-a7703acb7f35',
  })
  id!: string;

  @ApiProperty({
    example: '2026-06-25T10:15:30.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'failed'],
    example: 'in_progress',
  })
  status!: JobStatus;

  @ApiProperty({
    example: 3,
  })
  totalUrls!: number;

  @ApiProperty({
    type: JobStatsDto,
  })
  stats!: JobStatsDto;
}

export class UrlCheckDto {
  @ApiProperty({
    example: 'https://example.com',
  })
  url!: string;

  @ApiProperty({
    enum: ['pending', 'in_progress', 'success', 'error', 'cancelled'],
    example: 'success',
  })
  status!: UrlCheckStatus;

  @ApiPropertyOptional({
    example: 200,
  })
  httpStatus?: number;

  @ApiPropertyOptional({
    example: 'HTTP status 404',
  })
  errorMessage?: string;

  @ApiPropertyOptional({
    example: '2026-06-25T10:15:31.000Z',
  })
  startedAt?: string;

  @ApiPropertyOptional({
    example: '2026-06-25T10:15:35.000Z',
  })
  finishedAt?: string;

  @ApiPropertyOptional({
    example: 4200,
  })
  durationMs?: number;
}

export class JobDetailsDto {
  @ApiProperty({
    example: 'f2f7d2f1-236b-4b84-94c7-a7703acb7f35',
  })
  id!: string;

  @ApiProperty({
    example: '2026-06-25T10:15:30.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'failed'],
    example: 'completed',
  })
  status!: JobStatus;

  @ApiProperty({
    type: [UrlCheckDto],
  })
  urls!: UrlCheckDto[];
}
