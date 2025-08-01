import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Set global prefix to match production setup
    app.setGlobalPrefix('api');
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api (GET)', () => {
    it('should return application information', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Case Management System API');
          expect(res.body).toHaveProperty('version', '1.0.0');
          expect(res.body).toHaveProperty('environment');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('description');
          
          // Validate timestamp format
          expect(() => new Date(res.body.timestamp)).not.toThrow();
          expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
          
          // Validate description
          expect(res.body.description).toContain('NestJS backend API');
          expect(res.body.description).toContain('n8n integration');
        });
    });

    it('should return test environment in test mode', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect((res) => {
          expect(res.body.environment).toBe('test');
        });
    });
  });

  describe('Global middleware', () => {
    it('should have CORS headers', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect((res) => {
          // CORS headers should be present
          expect(res.headers).toHaveProperty('access-control-allow-origin');
        });
    });

    it('should handle OPTIONS requests', () => {
      return request(app.getHttpServer())
        .options('/api')
        .expect(204);
    });

    it('should compress responses', () => {
      return request(app.getHttpServer())
        .get('/api')
        .set('Accept-Encoding', 'gzip')
        .expect(200)
        .expect((res) => {
          // Compression middleware should be active
          expect(res.headers).toHaveProperty('vary');
        });
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/non-existent-endpoint')
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 404);
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path', '/api/non-existent-endpoint');
          expect(res.body).toHaveProperty('method', 'GET');
        });
    });

    it('should handle 405 Method Not Allowed', () => {
      return request(app.getHttpServer())
        .post('/api') // POST to GET-only endpoint
        .expect(405)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 405);
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('Security headers', () => {
    it('should include security headers', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200)
        .expect((res) => {
          // Helmet security headers
          expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
          expect(res.headers).toHaveProperty('x-frame-options');
          expect(res.headers).toHaveProperty('x-download-options', 'noopen');
        });
    });
  });

  describe('API prefix', () => {
    it('should not respond to root path without api prefix', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(404);
    });

    it('should respond correctly with api prefix', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(200);
    });
  });
});