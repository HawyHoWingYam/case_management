import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
  }

  async onModuleInit() {

    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error);
    }
  }

  /**
   * Clean database for testing purposes only
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase can only be used in test environment');
    }

    try {
      // Get all table names
      const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname='public'
      `;

      // Truncate all tables except migrations
      for (const { tablename } of tablenames) {
        if (tablename !== '_prisma_migrations') {
          try {
            await this.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
          } catch (error) {
            this.logger.warn(`Could not truncate ${tablename}, probably doesn't exist.`);
          }
        }
      }

      this.logger.log('Database cleaned for testing');
    } catch (error) {
      this.logger.error('Error cleaning database:', error);
      throw error;
    }
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<{ status: string; responseTime?: number }> {
    try {
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      return {
        status: 'connected',
        responseTime,
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'disconnected',
      };
    }
  }
}