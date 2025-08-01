import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Health (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Set global prefix to match production setup
    app.setGlobalPrefix('api');
    
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/health (GET)', () => {
    it('should return basic health status', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(typeof res.body.uptime).toBe('number');
          expect(res.body.uptime).toBeGreaterThan(0);
        });
    });

    it('should return valid timestamp format', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          const timestamp = res.body.timestamp;
          expect(() => new Date(timestamp)).not.toThrow();
          expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });
    });
  });

  describe('/api/health/detailed (GET)', () => {
    it('should return detailed health status', () => {
      return request(app.getHttpServer())
        .get('/api/health/detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('services');
          
          const services = res.body.services;
          expect(services).toHaveProperty('database');
          expect(services).toHaveProperty('memory');
          
          // Database service
          expect(services.database).toHaveProperty('status');
          expect(['connected', 'disconnected']).toContain(services.database.status);
          
          if (services.database.status === 'connected') {
            expect(services.database).toHaveProperty('responseTime');
            expect(typeof services.database.responseTime).toBe('number');
            expect(services.database.responseTime).toBeGreaterThan(0);
          }
          
          // Memory service
          expect(services.memory).toHaveProperty('used');
          expect(services.memory).toHaveProperty('total');
          expect(services.memory).toHaveProperty('unit', 'MB');
          expect(typeof services.memory.used).toBe('number');
          expect(typeof services.memory.total).toBe('number');
          expect(services.memory.used).toBeGreaterThan(0);
          expect(services.memory.total).toBeGreaterThan(0);
          expect(services.memory.used).toBeLessThanOrEqual(services.memory.total);
        });
    });

    it('should handle database connectivity issues gracefully', async () => {
      // Mock database disconnect
      jest.spyOn(prismaService, 'healthCheck').mockResolvedValue({
        status: 'disconnected',
      });

      const response = await request(app.getHttpServer())
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body.services.database.status).toBe('disconnected');
      expect(response.body.services.database.responseTime).toBeUndefined();

      // Restore mock
      jest.restoreAllMocks();
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting after multiple requests', async () => {
      const requests = [];
      
      // Make multiple requests quickly (more than the limit)
      for (let i = 0; i < 120; i++) {
        requests.push(
          request(app.getHttpServer())
            .get('/api/health')
        );
      }

      const responses = await Promise.all(requests);
      
      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000); // Increase timeout for this test
  });
});