import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsProcessorService } from './jobs-processor/jobs-processor.service';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobsProcessorService: JobsProcessorService,
  ) {}

  @Get()
  findAll() {
    return this.jobsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOneOrFail(id);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.jobsService.cancel(id);
  }

  @Post()
  create(@Body() createJobDto: CreateJobDto) {
    const result = this.jobsService.create(createJobDto);

    setImmediate(() => this.jobsProcessorService.process(result.jobId));

    return result;
  }
}
