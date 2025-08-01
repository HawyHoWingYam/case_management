import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as request from 'supertest';
import { of, throwError } from 'rxjs';
import { AppModule } from '../src/app.module';

describe('Webhooks (e2e)', () => {
  let app: INestApplication;
  let httpService: HttpService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Set global prefix to match production setup
    app.setGlobalPrefix('api');
    
    httpService = moduleFixture.get<HttpService>(HttpService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/n8n-test (POST)', () => {
    it('should send test webhook successfully', async () => {
      // Mock successful HTTP response
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { success: true },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const payload = {
        message: 'Test message from e2e test',
        data: { 
          testId: '123',
          environment: 'test' 
        },
        eventType: 'e2e-test',
      };

      return request(app.getHttpServer())
        .post('/api/n8n-test')
        .send(payload)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message', 'Test webhook sent to n8n successfully');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('n8nResponse');
          expect(res.body.n8nResponse).toEqual({
            status: 200,
            statusText: 'OK',
          });
        });
    });

    it('should handle n8n service unavailable', async () => {
      // Mock HTTP service error
      const mockError = {
        message: 'Service Unavailable',
        response: {
          status: 503,
          data: 'n8n service is down',
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => mockError));

      const payload = {
        message: 'Test message that will fail',
      };

      return request(app.getHttpServer())
        .post('/api/n8n-test')
        .send(payload)
        .expect(503)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 503);
          expect(res.body).toHaveProperty('error', 'WebhookServiceUnavailable');
          expect(res.body).toHaveProperty('message', 'n8n webhook service is unavailable');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('path', '/api/n8n-test');
          expect(res.body).toHaveProperty('method', 'POST');
        });
    });

    it('should validate request payload', async () => {
      const invalidPayload = {
        // Missing required 'message' field
        data: { test: true },
      };

      return request(app.getHttpServer())
        .post('/api/n8n-test')
        .send(invalidPayload)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message).toContain('message should not be empty');
        });
    });

    it('should reject non-whitelisted properties', async () => {
      const payloadWithExtraProps = {
        message: 'Valid message',
        data: { test: true },
        maliciousField: 'This should be rejected',
        anotherBadField: 'Also rejected',
      };

      return request(app.getHttpServer())
        .post('/api/n8n-test')
        .send(payloadWithExtraProps)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message.some(msg => 
            msg.includes('maliciousField') || msg.includes('anotherBadField')
          )).toBe(true);
        });
    });

    it('should handle timeout errors', async () => {
      // Mock timeout error
      jest.spyOn(httpService, 'post').mockReturnValue(
        throwError(() => new Error('Timeout'))
      );

      const payload = {
        message: 'Test message that will timeout',
      };

      return request(app.getHttpServer())
        .post('/api/n8n-test')
        .send(payload)
        .expect(503);
    });

    it('should send correct webhook data format to n8n', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { received: true },
      };

      const postSpy = jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const payload = {
        message: 'Test webhook format',
        data: { 
          userId: '456',
          caseId: '789' 
        },
        eventType: 'format-test',
      };

      await request(app.getHttpServer())
        .post('/api/n8n-test')
        .send(payload)
        .expect(200);

      // Verify the format sent to n8n
      expect(postSpy).toHaveBeenCalledWith(
        expect.any(String), // n8n webhook URL
        expect.objectContaining({
          event: 'test',
          timestamp: expect.any(String),
          source: 'case-management-backend',
          data: payload,
        })
      );
    });
  });

  describe('Content-Type handling', () => {
    it('should accept application/json content type', async () => {
      jest.spyOn(httpService, 'post').mockReturnValue(of({
        status: 200,
        statusText: 'OK',
        data: {},
      }));

      const payload = {
        message: 'JSON content type test',
      };

      return request(app.getHttpServer())
        .post('/api/n8n-test')
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(200);
    });

    it('should reject unsupported content types', async () => {
      const payload = 'message=test';

      return request(app.getHttpServer())
        .post('/api/n8n-test')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(payload)
        .expect(400);
    });
  });
});