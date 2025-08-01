import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckDto {
  @ApiProperty({ example: 'ok', description: 'Health status' })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Timestamp of health check' })
  timestamp: string;

  @ApiProperty({ example: 3600.5, description: 'Application uptime in seconds' })
  uptime: number;
}

export class ServiceHealthDto {
  @ApiProperty({ example: 'connected', description: 'Service status' })
  status: string;

  @ApiProperty({ example: 25, description: 'Response time in milliseconds', required: false })
  responseTime?: number;
}

export class MemoryUsageDto {
  @ApiProperty({ example: 45, description: 'Used memory in MB' })
  used: number;

  @ApiProperty({ example: 128, description: 'Total memory in MB' })
  total: number;

  @ApiProperty({ example: 'MB', description: 'Memory unit' })
  unit: string;
}

export class DetailedHealthDto extends HealthCheckDto {
  @ApiProperty({
    description: 'Detailed service health information',
    type: 'object',
    properties: {
      database: { $ref: '#/components/schemas/ServiceHealthDto' },
      memory: { $ref: '#/components/schemas/MemoryUsageDto' },
    },
  })
  services: {
    database: ServiceHealthDto;
    memory: MemoryUsageDto;
  };
}