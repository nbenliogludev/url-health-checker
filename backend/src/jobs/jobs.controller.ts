import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateJobDto } from './dto/create-job.dto';
import {
  CreateJobResponseDto,
  JobDetailsDto,
  JobSummaryDto,
} from './dto/job-response.dto';
import { JobsProcessorService } from './jobs-processor/jobs-processor.service';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobsProcessorService: JobsProcessorService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get jobs list' })
  @ApiOkResponse({
    description: 'List of jobs with short status and result counters',
    type: [JobSummaryDto],
  })
  findAll() {
    return this.jobsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job details' })
  @ApiParam({ name: 'id', description: 'Job id' })
  @ApiOkResponse({
    description: 'Job details with URL check results',
    type: JobDetailsDto,
  })
  @ApiNotFoundResponse({ description: 'Job not found' })
  findOne(@Param('id') id: string) {
    return this.jobsService.findOneOrFail(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel job' })
  @ApiParam({ name: 'id', description: 'Job id' })
  @ApiOkResponse({
    description: 'Cancelled job details',
    type: JobDetailsDto,
  })
  @ApiNotFoundResponse({ description: 'Job not found' })
  cancel(@Param('id') id: string) {
    return this.jobsService.cancel(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create URL check job' })
  @ApiCreatedResponse({
    description: 'Job created and background processing started',
    type: CreateJobResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid URL list' })
  create(@Body() createJobDto: CreateJobDto) {
    const result = this.jobsService.create(createJobDto);

    setImmediate(() => this.jobsProcessorService.process(result.jobId));

    return result;
  }
}
