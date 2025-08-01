import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getApplicationInfo() {
    return {
      name: 'Case Management System API',
      version: '1.0.0',
      environment: this.configService.get('app.nodeEnv'),
      timestamp: new Date().toISOString(),
      description: 'NestJS backend API for Case Management System with n8n integration',
    };
  }
}