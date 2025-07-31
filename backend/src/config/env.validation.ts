import { plainToClass, Transform } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsBoolean, validateSync, IsIn } from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string = 'development';

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  PORT: number = 3001;

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string = 'http://localhost:3000';

  // Database Configuration
  @IsString()
  DB_HOST: string = 'localhost';

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  DB_PORT: number = 5433;

  @IsString()
  DB_USERNAME: string = 'postgres';

  @IsString()
  DB_PASSWORD: string = 'admin';

  @IsString()
  DB_NAME: string = 'case_management_dev';

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  DB_SSL?: boolean = false;

  // Test Database Configuration
  @IsString()
  @IsOptional()
  TEST_DB_HOST?: string = 'localhost';

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  TEST_DB_PORT?: number = 5433;

  @IsString()
  @IsOptional()
  TEST_DB_USERNAME?: string = 'postgres';

  @IsString()
  @IsOptional()
  TEST_DB_PASSWORD?: string = 'admin';

  @IsString()
  @IsOptional()
  TEST_DB_NAME?: string = 'case_management_test';

  // JWT Configuration
  @IsString()
  JWT_SECRET: string = 'development-jwt-secret-change-in-production';

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string = '24h';

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET?: string = 'development-jwt-refresh-secret-change-in-production';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN?: string = '7d';

  // Redis Configuration
  @IsString()
  @IsOptional()
  REDIS_HOST?: string = 'localhost';

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  REDIS_PORT?: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string = '';

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  REDIS_DB?: number = 0;

  // AWS Configuration
  @IsString()
  @IsOptional()
  AWS_REGION?: string = 'us-east-1';

  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID?: string = 'test';

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY?: string = 'test';

  @IsString()
  @IsOptional()
  AWS_ENDPOINT_URL?: string = 'http://localhost:4566';

  @IsString()
  @IsOptional()
  S3_BUCKET_NAME?: string = 'case-management-documents';

  // Logging Configuration
  @IsIn(['error', 'warn', 'info', 'debug', 'verbose'])
  @IsOptional()
  LOG_LEVEL?: string = 'debug';

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  LOG_FILE_ENABLED?: boolean = true;

  @IsString()
  @IsOptional()
  LOG_FILE_PATH?: string = './logs/application.log';

  // Security Configuration
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  BCRYPT_SALT_ROUNDS?: number = 12;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  RATE_LIMIT_WINDOW_MS?: number = 900000;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  RATE_LIMIT_MAX_REQUESTS?: number = 100;

  // File Upload Configuration
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  MAX_FILE_SIZE?: number = 10485760; // 10MB

  @IsString()
  @IsOptional()
  ALLOWED_FILE_TYPES?: string = 'pdf,doc,docx,jpg,jpeg,png,txt';
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  return validatedConfig;
}