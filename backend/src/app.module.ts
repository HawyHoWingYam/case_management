import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { APP_FILTER } from '@nestjs/core';

// Configuration
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { createLoggerConfig } from './config/logger.config';

// Modules
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AuthModule } from './auth/auth.module';

// Core components
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Global filters
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    // Configuration module with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Logging module
    WinstonModule.forRoot(createLoggerConfig().options),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigModule],
      useFactory: async () => ({
        ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
        limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
      }),
    }),

    // Core modules
    PrismaModule,
    AuthModule,
    HealthModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}