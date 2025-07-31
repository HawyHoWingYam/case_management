import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const isTest = this.configService.get('NODE_ENV') === 'test';

    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'admin'),
      database: isTest 
        ? this.configService.get<string>('TEST_DB_NAME', 'case_management_test')
        : this.configService.get<string>('DB_NAME', 'case_management_dev'),
      
      // Entity configuration
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      subscribers: [__dirname + '/../**/*.subscriber{.ts,.js}'],
      
      // Development settings
      synchronize: false, // Temporarily disabled due to enum conflicts
      logging: !isProduction && !isTest ? ['query', 'error', 'warn'] : ['error'],
      dropSchema: isTest, // Drop schema for test environment
      
      // Connection pool settings
      maxQueryExecutionTime: 5000, // Log slow queries
      extra: {
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
      },
      
      // Naming strategy for consistent column naming
      // namingStrategy: new SnakeNamingStrategy(), // Commented out until dependency is installed
      
      // SSL configuration
      ssl: this.configService.get<boolean>('DB_SSL', false) ? {
        rejectUnauthorized: false,
      } : false,
      
      // Auto-load entities
      autoLoadEntities: true,
      
      // Connection retry configuration
      retryAttempts: 3,
      retryDelay: 3000,
    };
  }
}