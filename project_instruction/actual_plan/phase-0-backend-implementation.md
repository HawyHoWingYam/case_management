# Phase 0 Backend Implementation Plan - NestJS API Foundation

## Overview
This comprehensive plan details the implementation of a robust NestJS backend foundation for the Case Management System Phase 0, focusing on scalability, security, and seamless integration with n8n workflow automation.

## 1. NestJS Project Initialization & Dependencies

### Core Dependencies Setup
```json
{
  "name": "case-management-backend",
  "version": "1.0.0",
  "dependencies": {
    "@nestjs/core": "^10.0.0",
    "@nestjs/common": "^10.0.0", 
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/throttler": "^5.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/terminus": "^10.0.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "bcrypt": "^5.1.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "uuid": "^9.0.0",
    "axios": "^1.4.0",
    "winston": "^3.10.0",
    "nest-winston": "^1.9.0",
    "helmet": "^7.0.0",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/node": "^20.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/passport-jwt": "^3.0.9",
    "@types/passport-local": "^1.0.35",
    "@types/uuid": "^9.0.0",
    "@types/compression": "^1.7.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.0",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  }
}
```

## 2. Project Structure & Module Architecture

### Directory Structure
```
backend/
├── src/
│   ├── common/
│   │   ├── decorators/         # Custom decorators (@CurrentUser, @Roles)
│   │   ├── filters/            # Exception filters (HTTP, Validation)
│   │   ├── guards/             # Authentication & authorization guards
│   │   ├── interceptors/       # Logging, transform, cache interceptors
│   │   ├── pipes/             # Validation & transformation pipes
│   │   ├── dto/               # Common DTOs
│   │   └── enums.ts           # Shared enums (UserRole, CaseStatus)
│   ├── config/
│   │   ├── configuration.ts    # App configuration
│   │   ├── database.config.ts  # Database configuration
│   │   ├── jwt.config.ts      # JWT configuration
│   │   └── validation.schema.ts # Environment validation
│   ├── health/
│   │   ├── health.controller.ts
│   │   ├── health.module.ts
│   │   └── health.service.ts
│   ├── webhooks/
│   │   ├── webhooks.controller.ts
│   │   ├── webhooks.module.ts
│   │   ├── webhooks.service.ts
│   │   └── dto/
│   │       └── webhook-payload.dto.ts
│   ├── auth/                   # Authentication module (future)
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   ├── guards/
│   │   └── dto/
│   ├── users/                  # User management (future)
│   ├── cases/                  # Case management (future)
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/
│   └── Dockerfile
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── nest-cli.json
├── tsconfig.json
└── package.json
```

## 3. Initial API Endpoints Implementation

### Health Check System (`/api/health`)

#### Health Controller
```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckDto, DetailedHealthDto } from './dto/health.dto';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy', type: HealthCheckDto })
  async getHealth(): Promise<HealthCheckDto> {
    return this.healthService.getBasicHealth();
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with dependencies' })
  @ApiResponse({ status: 200, description: 'Detailed health status', type: DetailedHealthDto })
  async getDetailedHealth(): Promise<DetailedHealthDto> {
    return this.healthService.getDetailedHealth();
  }
}
```

#### Health Service
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthCheckDto, DetailedHealthDto } from './dto/health.dto';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async getBasicHealth(): Promise<HealthCheckDto> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async getDetailedHealth(): Promise<DetailedHealthDto> {
    const basicHealth = await this.getBasicHealth();
    
    // Check database connectivity
    const dbStatus = await this.checkDatabase();
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    return {
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
  }

  private async checkDatabase(): Promise<{ status: string; responseTime?: number }> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      
      return {
        status: 'connected',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'disconnected',
      };
    }
  }
}
```

### n8n Integration Endpoint (`/api/n8n-test`)

#### Webhooks Controller
```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { WebhookPayloadDto, WebhookResponseDto } from './dto/webhook-payload.dto';

@ApiTags('Webhooks')
@Controller('api')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('n8n-test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test n8n integration' })
  @ApiBody({ type: WebhookPayloadDto })
  @ApiResponse({ status: 200, description: 'Webhook sent successfully', type: WebhookResponseDto })
  async testN8nIntegration(@Body() payload: WebhookPayloadDto): Promise<WebhookResponseDto> {
    return this.webhooksService.sendTestWebhook(payload);
  }
}
```

#### Webhooks Service
```typescript
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { WebhookPayloadDto, WebhookResponseDto } from './dto/webhook-payload.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly n8nWebhookUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.n8nWebhookUrl = this.configService.get<string>('N8N_WEBHOOK_URL');
  }

  async sendTestWebhook(payload: WebhookPayloadDto): Promise<WebhookResponseDto> {
    const webhookData = {
      event: 'test',
      timestamp: new Date().toISOString(),
      source: 'case-management-backend',
      data: payload,
    };

    try {
      this.logger.log(`Sending webhook to n8n: ${this.n8nWebhookUrl}`);
      
      const response = await firstValueFrom(
        this.httpService.post(this.n8nWebhookUrl, webhookData).pipe(
          timeout(5000),
          catchError((error) => {
            this.logger.error(`n8n webhook failed: ${error.message}`);
            throw new HttpException(
              'n8n webhook service unavailable',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      this.logger.log(`n8n webhook successful: ${response.status}`);
      
      return {
        success: true,
        message: 'Webhook sent to n8n successfully',
        timestamp: new Date().toISOString(),
        n8nResponse: {
          status: response.status,
          statusText: response.statusText,
        },
      };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);
      throw error;
    }
  }

  async sendBusinessWebhook(event: string, data: any): Promise<void> {
    // Future implementation for business events
    // (case created, assigned, status changed, etc.)
    const webhookData = {
      event,
      timestamp: new Date().toISOString(),
      source: 'case-management-backend',
      data,
    };

    try {
      await firstValueFrom(
        this.httpService.post(this.n8nWebhookUrl, webhookData).pipe(
          timeout(5000),
        ),
      );
      this.logger.log(`Business webhook sent: ${event}`);
    } catch (error) {
      this.logger.error(`Business webhook failed for ${event}: ${error.message}`);
      // Don't throw error for business webhooks - they should be non-blocking
    }
  }
}
```

## 4. Database Integration with Prisma

### Prisma Service
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query', (e) => {
        this.logger.log(`Query: ${e.query} -- Params: ${e.params} -- Duration: ${e.duration}ms`);
      });
    }

    this.$on('error', (e) => {
      this.logger.error(`Database error: ${e.message}`);
    });

    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async cleanDatabase() {
    // For testing purposes only
    if (process.env.NODE_ENV === 'test') {
      const tablenames = await this.$queryRaw`
        SELECT tablename FROM pg_tables WHERE schemaname='public'
      `;
      
      for (const { tablename } of tablenames) {
        if (tablename !== '_prisma_migrations') {
          try {
            await this.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
          } catch (error) {
            this.logger.warn(`Could not truncate ${tablename}, probably doesn't exist.`);
          }
        }
      }
    }
  }
}
```

### Prisma Module
```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

## 5. Error Handling & Logging Architecture

### Global Exception Filter
```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
      } else {
        message = exceptionResponse;
        error = exception.name;
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      // Handle Prisma-specific errors
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Resource already exists';
          error = 'ConflictError';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Resource not found';
          error = 'NotFoundError';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Database error';
          error = 'DatabaseError';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
    };

    // Log error details
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : exception,
    );

    response.status(status).json(errorResponse);
  }
}
```

### Logging Configuration
```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});
```

## 6. Environment Configuration Management

### Configuration Module
```typescript
import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
}));

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  N8N_WEBHOOK_URL: Joi.string().uri().required(),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
});
```

## 7. Security & Performance Features

### Security Middleware Setup
```typescript
import helmet from 'helmet';
import * as compression from 'compression';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: loggerConfig,
  });

  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN'),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // API prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT');
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
}

bootstrap();
```

### Rate Limiting
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
  ],
})
export class AppModule {}
```

## 8. Testing Strategy

### Unit Test Example
```typescript
describe('HealthService', () => {
  let service: HealthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should return basic health status', async () => {
    const result = await service.getBasicHealth();
    
    expect(result).toHaveProperty('status', 'ok');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('uptime');
  });

  it('should return detailed health with database status', async () => {
    jest.spyOn(prismaService, '$queryRaw').mockResolvedValue([]);
    
    const result = await service.getDetailedHealth();
    
    expect(result).toHaveProperty('services');
    expect(result.services).toHaveProperty('database');
    expect(result.services.database.status).toBe('connected');
  });
});
```

### Integration Test Example
```typescript
describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## 9. CI/CD Integration Points

### Package.json Scripts
```json
{
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "seed": "ts-node prisma/seed.ts"
  }
}
```

## Implementation Timeline

### Phase 0.1 (Week 1): Core Foundation
1. NestJS project initialization with dependencies
2. Basic project structure and configuration
3. Database connection with Prisma
4. Health check endpoints implementation

### Phase 0.2 (Week 2): Integration & Testing
1. n8n webhook integration
2. Error handling and logging setup
3. Security middleware implementation
4. Unit and integration tests

### Phase 0.3 (Week 3): Production Readiness
1. Docker containerization
2. CI/CD pipeline integration
3. Performance optimization
4. Documentation and API specs

This comprehensive backend plan establishes a solid foundation for the Case Management System while ensuring scalability, maintainability, and integration with n8n workflows following NestJS best practices.