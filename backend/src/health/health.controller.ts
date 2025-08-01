import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckDto, DetailedHealthDto } from './dto/health.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: HealthCheckDto,
  })
  async getHealth(): Promise<HealthCheckDto> {
    return this.healthService.getBasicHealth();
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with dependencies' })
  @ApiResponse({
    status: 200,
    description: 'Detailed health status',
    type: DetailedHealthDto,
  })
  async getDetailedHealth(): Promise<DetailedHealthDto> {
    return this.healthService.getDetailedHealth();
  }
}