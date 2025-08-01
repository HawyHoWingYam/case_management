import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Case Management System API is running! 🚀';
  }

  async getHealth() {
    const startTime = Date.now();
    
    // 测试数据库连接
    let databaseStatus = 'unknown';
    let databaseLatency = 0;
    
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      databaseLatency = Date.now() - dbStart;
      databaseStatus = 'connected';
    } catch (error) {
      databaseStatus = 'disconnected';
      console.error('Database health check failed:', error);
    }

    const responseTime = Date.now() - startTime;

    return {
      status: databaseStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: {
          status: databaseStatus,
          latency: `${databaseLatency}ms`,
        },
        api: {
          status: 'ok',
          responseTime: `${responseTime}ms`,
        },
      },
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      },
    };
  }

  async getApiInfo() {
    return {
      name: 'Case Management System API',
      version: '1.0.0',
      description: '案例管理系统后端 API',
      environment: process.env.NODE_ENV || 'development',
      docs: '/api/docs',
      endpoints: {
        health: '/api/health',
        info: '/api/info',
        cases: '/api/cases',
        users: '/api/users',
      },
    };
  }
}