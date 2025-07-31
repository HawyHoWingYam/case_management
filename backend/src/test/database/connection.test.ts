/**
 * Database Connection Tests
 * 
 * These tests validate that the PostgreSQL database connection is properly configured
 * and can establish connections for both development and test environments.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { DatabaseConfig } from '../../config/database.config';
import { TEST_CONFIG } from '../setup';

describe('Database Connection Tests', () => {
  let dataSource: DataSource;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          useFactory: () => TEST_CONFIG.database,
        }),
      ],
      providers: [DatabaseConfig],
    }).compile();

    dataSource = module.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (module) {
      await module.close();
    }
  });

  describe('Connection Establishment', () => {
    it('should establish connection to test database', async () => {
      expect(dataSource).toBeDefined();
      expect(dataSource.isInitialized).toBe(true);
    });

    it('should connect to the correct test database', async () => {
      const dbName = dataSource.options.database;
      expect(dbName).toBe('case_management_test');
    });

    it('should use correct database credentials', async () => {
      const options = dataSource.options as any;
      expect(options.host).toBe('localhost');
      expect(options.port).toBe(5432);
      expect(options.username).toBe('postgres');
      expect(options.type).toBe('postgres');
    });

    it('should have synchronize enabled for tests', async () => {
      const options = dataSource.options as any;
      expect(options.synchronize).toBe(true);
    });

    it('should have dropSchema enabled for tests', async () => {
      const options = dataSource.options as any;
      expect(options.dropSchema).toBe(true);
    });
  });

  describe('Database Health Checks', () => {
    it('should execute a simple query successfully', async () => {
      const result = await dataSource.query('SELECT 1 as test');
      expect(result).toEqual([{ test: 1 }]);
    });

    it('should check database version', async () => {
      const result = await dataSource.query('SELECT version()');
      expect(result).toHaveLength(1);
      expect(result[0].version).toContain('PostgreSQL');
    });

    it('should verify current database name', async () => {
      const result = await dataSource.query('SELECT current_database()');
      expect(result).toHaveLength(1);
      expect(result[0].current_database).toBe('case_management_test');
    });

    it('should check connection status', async () => {
      const result = await dataSource.query('SELECT current_user, inet_server_addr(), inet_server_port()');
      expect(result).toHaveLength(1);
      expect(result[0].current_user).toBe('postgres');
    });
  });

  describe('Connection Pool Management', () => {
    it('should have proper connection pool configuration', async () => {
      const options = dataSource.options as any;
      expect(options.extra?.connectionLimit).toBeDefined();
      expect(options.extra?.acquireTimeout).toBeDefined();
      expect(options.extra?.timeout).toBeDefined();
    });

    it('should handle concurrent connections', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        dataSource.query(`SELECT ${i + 1} as connection_test`)
      );
      
      const results = await Promise.all(promises);
      
      results.forEach((result, index) => {
        expect(result).toEqual([{ connection_test: index + 1 }]);
      });
    });

    it('should gracefully handle connection timeouts', async () => {
      // Test connection timeout handling
      const startTime = Date.now();
      
      try {
        await dataSource.query('SELECT pg_sleep(0.1)'); // Short sleep
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(1000); // Should complete quickly
      } catch (error) {
        fail('Query should not timeout with reasonable duration');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid SQL queries gracefully', async () => {
      await expect(
        dataSource.query('INVALID SQL QUERY')
      ).rejects.toThrow();
    });

    it('should handle non-existent table queries', async () => {
      await expect(
        dataSource.query('SELECT * FROM non_existent_table')
      ).rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      try {
        await dataSource.query('SELECT * FROM non_existent_table');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('non_existent_table');
      }
    });
  });

  describe('Transaction Support', () => {
    it('should support database transactions', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        await queryRunner.startTransaction();
        
        // Create a temporary table within transaction
        await queryRunner.query('CREATE TEMP TABLE test_transaction (id INT)');
        await queryRunner.query('INSERT INTO test_transaction VALUES (1)');
        
        const result = await queryRunner.query('SELECT * FROM test_transaction');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
        
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    });

    it('should handle transaction rollbacks', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        await queryRunner.startTransaction();
        
        // Create a temporary table and insert data
        await queryRunner.query('CREATE TEMP TABLE test_rollback (id INT)');
        await queryRunner.query('INSERT INTO test_rollback VALUES (1)');
        
        // Verify data exists
        let result = await queryRunner.query('SELECT * FROM test_rollback');
        expect(result).toHaveLength(1);
        
        // Rollback transaction
        await queryRunner.rollbackTransaction();
        
        // Data should not exist after rollback
        // Note: TEMP tables are automatically dropped after rollback
        await expect(
          queryRunner.query('SELECT * FROM test_rollback')
        ).rejects.toThrow();
        
      } finally {
        await queryRunner.release();
      }
    });
  });

  describe('Environment Isolation', () => {
    it('should be isolated from production database', () => {
      const dbName = dataSource.options.database;
      expect(dbName).not.toBe('case_management_prod');
      expect(dbName).not.toBe('case_management');
      expect(dbName).toBe('case_management_test');
    });

    it('should have test-specific configuration', async () => {
      const options = dataSource.options as any;
      
      // Test environment should have these enabled
      expect(options.synchronize).toBe(true);
      expect(options.dropSchema).toBe(true);
      expect(options.logging).toBe(false);
    });

    it('should use test environment variables', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });
  });
});