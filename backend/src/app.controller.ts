import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('系统信息')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '获取应用欢迎信息' })
  @ApiResponse({ status: 200, description: '欢迎信息' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: '系统健康检查' })
  @ApiResponse({ 
    status: 200, 
    description: '系统健康状态',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-08-01T17:30:00.000Z' },
        uptime: { type: 'number', example: 123.456 },
        environment: { type: 'string', example: 'development' },
        version: { type: 'string', example: '1.0.0' },
        services: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'connected' },
                latency: { type: 'string', example: '5ms' }
              }
            },
            api: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'ok' },
                responseTime: { type: 'string', example: '2ms' }
              }
            }
          }
        },
        memory: {
          type: 'object',
          properties: {
            used: { type: 'string', example: '45MB' },
            total: { type: 'string', example: '128MB' }
          }
        }
      }
    }
  })
  async getHealth() {
    return await this.appService.getHealth();
  }

  @Get('info')
  @ApiOperation({ summary: '获取API信息' })
  @ApiResponse({ 
    status: 200, 
    description: 'API基本信息',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Case Management System API' },
        version: { type: 'string', example: '1.0.0' },
        description: { type: 'string', example: '案例管理系统后端 API' },
        environment: { type: 'string', example: 'development' },
        docs: { type: 'string', example: '/api/docs' },
        endpoints: {
          type: 'object',
          properties: {
            health: { type: 'string', example: '/api/health' },
            info: { type: 'string', example: '/api/info' },
            cases: { type: 'string', example: '/api/cases' },
            users: { type: 'string', example: '/api/users' }
          }
        }
      }
    }
  })
  async getInfo() {
    return await this.appService.getApiInfo();
  }
}