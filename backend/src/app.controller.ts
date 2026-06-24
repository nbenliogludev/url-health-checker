import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get API status' })
  @ApiOkResponse({
    description: 'API is running',
    schema: {
      example: {
        status: 'ok',
      },
    },
  })
  getStatus() {
    return this.appService.getStatus();
  }
}
