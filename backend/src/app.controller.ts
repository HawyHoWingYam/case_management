import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get application information' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application information',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Case Management System API' },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'development' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  getApplicationInfo() {
    return this.appService.getApplicationInfo();
  }
}