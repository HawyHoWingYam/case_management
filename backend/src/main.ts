import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as helmet from 'helmet';
import * as compression from 'compression';

import { AppModule } from './app.module';
import { createLoggerConfig } from './config/logger.config';

async function bootstrap() {
  // Create application with custom logger
  const app = await NestFactory.create(AppModule, {
    logger: createLoggerConfig(),
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  const corsOrigin = configService.get<string>('app.cors.origin');
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Rate limiting guard
  app.useGlobalGuards(
    new ThrottlerGuard({
      errorMessage: 'Too many requests, please try again later.',
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger/OpenAPI documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Case Management System API')
      .setDescription('NestJS backend API for Case Management System with n8n workflow integration')
      .setVersion('1.0.0')
      .addTag('Application', 'Application information and root endpoints')
      .addTag('Health', 'System health check endpoints')
      .addTag('Webhooks', 'n8n webhook integration endpoints')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addServer('http://localhost:3001', 'Development server')
      .addServer('https://api.case-management.example.com', 'Production server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Case Management API Documentation',
    });

    logger.log('📚 Swagger documentation available at: http://localhost:3001/api/docs');
  }

  // Graceful shutdown hooks
  app.enableShutdownHooks();

  const port = configService.get<number>('app.port');
  const nodeEnv = configService.get<string>('app.nodeEnv');

  await app.listen(port);

  // Log startup information
  logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔄 CORS enabled for: ${corsOrigin}`);
  logger.log(`⚡ Health check: http://localhost:${port}/api/health`);
  logger.log(`📡 n8n test endpoint: http://localhost:${port}/api/n8n-test`);

  // Log environment warnings
  if (nodeEnv === 'production') {
    logger.warn('🔒 Running in production mode - debug features disabled');
  } else {
    logger.log('🔧 Running in development mode - debug features enabled');
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});