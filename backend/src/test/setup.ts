/**
 * Global test setup file for backend tests
 * This file runs before all tests and sets up the testing environment
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Repository, DataSource } from 'typeorm';

// Global test timeout
jest.setTimeout(30000);

// Global test configuration
export const TEST_CONFIG = {
  database: {
    type: 'postgres' as const,
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    username: process.env.TEST_DB_USERNAME || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'admin',
    database: process.env.TEST_DB_NAME || 'case_management_test',
    synchronize: true,
    dropSchema: true,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    logging: false,
  },
  jwt: {
    secret: 'test-jwt-secret',
    expiresIn: '1h',
  },
  redis: {
    host: process.env.TEST_REDIS_HOST || 'localhost',
    port: parseInt(process.env.TEST_REDIS_PORT || '6380'),
    db: 1, // Use different DB for tests
  },
};

/**
 * Create a test database module for testing
 */
export const createTestDatabaseModule = () =>
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: () => TEST_CONFIG.database,
    inject: [ConfigService],
  });

/**
 * Global setup that runs before all tests
 */
beforeAll(async () => {
  // Set environment to test
  process.env.NODE_ENV = 'test';
  
  // Setup test database connection
  console.log('Setting up test environment...');
});

/**
 * Global cleanup that runs after all tests
 */
afterAll(async () => {
  console.log('Cleaning up test environment...');
});

/**
 * Helper function to create a test application
 */
export async function createTestApp(moduleMetadata: any): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule(moduleMetadata).compile();
  
  const app = module.createNestApplication();
  await app.init();
  
  return app;
}

/**
 * Helper function to get repository for testing
 */
export function getTestRepository<T>(
  app: INestApplication,
  entity: any,
): Repository<T> {
  return app.get<Repository<T>>(`${entity.name}Repository`);
}

/**
 * Helper function to clean database tables
 */
export async function cleanDatabase(dataSource: DataSource, entities: string[]): Promise<void> {
  for (const entity of entities) {
    await dataSource.query(`DELETE FROM "${entity}";`);
  }
}

/**
 * Create mock user for testing
 */
export const createMockUser = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'caseworker',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create mock case for testing
 */
export const createMockCase = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174001',
  title: 'Test Case',
  description: 'Test case description',
  status: 'open',
  priority: 'medium',
  assignedUserId: '123e4567-e89b-12d3-a456-426614174000',
  clientId: '123e4567-e89b-12d3-a456-426614174002',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});