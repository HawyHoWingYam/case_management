import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { WebhooksService } from './webhooks.service';
import { WebhookEvent } from '../common/enums';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    // Setup default config mock
    mockConfigService.get.mockReturnValue('http://localhost:5678/webhook/test');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendTestWebhook', () => {
    it('should send test webhook successfully', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { success: true },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const payload = {
        message: 'Test message',
        data: { test: true },
      };

      const result = await service.sendTestWebhook(payload);

      expect(result).toEqual({
        success: true,
        message: 'Test webhook sent to n8n successfully',
        timestamp: expect.any(String),
        n8nResponse: {
          status: 200,
          statusText: 'OK',
        },
      });

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:5678/webhook/test',
        expect.objectContaining({
          event: WebhookEvent.TEST_EVENT,
          timestamp: expect.any(String),
          source: 'case-management-backend',
          data: payload,
        }),
      );
    });

    it('should handle webhook service unavailable', async () => {
      const mockError = {
        message: 'Network Error',
        response: {
          status: 503,
          data: 'Service Unavailable',
        },
      };

      mockHttpService.post.mockReturnValue(throwError(() => mockError));

      const payload = {
        message: 'Test message',
      };

      await expect(service.sendTestWebhook(payload)).rejects.toThrow(HttpException);

      try {
        await service.sendTestWebhook(payload);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        expect(error.getResponse()).toEqual(
          expect.objectContaining({
            error: 'WebhookServiceUnavailable',
            message: 'n8n webhook service is unavailable',
          }),
        );
      }
    });

    it('should handle timeout error', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Timeout')));

      const payload = {
        message: 'Test message',
      };

      await expect(service.sendTestWebhook(payload)).rejects.toThrow(HttpException);
    });
  });

  describe('sendBusinessWebhook', () => {
    it('should send business webhook without throwing errors', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const testData = {
        caseId: '123',
        status: 'NEW',
      };

      // Should not throw any errors
      await expect(
        service.sendBusinessWebhook(WebhookEvent.CASE_CREATED, testData),
      ).resolves.toBeUndefined();

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:5678/webhook/test',
        expect.objectContaining({
          event: WebhookEvent.CASE_CREATED,
          data: testData,
          source: 'case-management-backend',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should not throw error when webhook fails', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Network Error')));

      const testData = {
        caseId: '123',
        status: 'NEW',
      };

      // Should not throw any errors even when webhook fails
      await expect(
        service.sendBusinessWebhook(WebhookEvent.CASE_CREATED, testData),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendCaseCreatedWebhook', () => {
    it('should send case created webhook with correct data structure', async () => {
      const mockResponse = { status: 200, statusText: 'OK' };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const caseData = {
        id: '123',
        title: 'Test Case',
        status: 'NEW',
        createdBy: 'user-456',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      await service.sendCaseCreatedWebhook(caseData);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:5678/webhook/test',
        expect.objectContaining({
          event: WebhookEvent.CASE_CREATED,
          data: {
            caseId: '123',
            title: 'Test Case',
            status: 'NEW',
            createdBy: 'user-456',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          source: 'case-management-backend',
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('checkWebhookHealth', () => {
    it('should return connected status on successful health check', async () => {
      const mockResponse = { status: 200, statusText: 'OK' };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.checkWebhookHealth();

      expect(result).toEqual({
        status: 'connected',
        responseTime: expect.any(Number),
      });

      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should return disconnected status on failed health check', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Connection failed')));

      const result = await service.checkWebhookHealth();

      expect(result).toEqual({
        status: 'disconnected',
      });
    });
  });
});