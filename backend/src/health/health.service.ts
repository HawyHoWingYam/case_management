import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthCheckDto, DetailedHealthDto } from './dto/health.dto';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private prisma: PrismaService) {}

  async getBasicHealth(): Promise<HealthCheckDto> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async getDetailedHealth(): Promise<DetailedHealthDto> {
    this.logger.log('Performing detailed health check');

    const basicHealth = await this.getBasicHealth();

    // Check database connectivity
    const dbStatus = await this.prisma.healthCheck();

    // Check memory usage
    const memoryUsage = process.memoryUsage();

    const detailedHealth: DetailedHealthDto = {
      ...basicHealth,
      services: {
        database: dbStatus,
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          unit: 'MB',
        },
      },
    };

    this.logger.log(
      `Health check completed - DB: ${dbStatus.status}, Memory: ${detailedHealth.services.memory.used}/${detailedHealth.services.memory.total}MB`,
    );

    return detailedHealth;
  }
}