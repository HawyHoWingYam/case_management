import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { message: string; timestamp: string; status: string } {
    return {
      message: 'Case Management API is running',
      timestamp: new Date().toISOString(),
      status: 'healthy',
    };
  }

  getVersion(): { version: string; environment: string; timestamp: string } {
    return {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  }
}