import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CasesModule } from './cases/cases.module';
import { DatabaseConfig } from './config/database.config';
import { validateEnvironment } from './config/env.validation';

@Module({
  imports: [
    // Configuration module with environment validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
      validate: validateEnvironment,
    }),
    
    // Database configuration
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),
    
    // Feature modules
    AuthModule,
    UsersModule,
    CasesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}