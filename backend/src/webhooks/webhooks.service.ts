import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { WebhookPayloadDto, WebhookResponseDto, BusinessWebhookDto } from './dto/webhook-payload.dto';
import { WebhookEvent } from '../common/enums';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly n8nWebhookUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.n8nWebhookUrl = this.configService.get<string>('app.n8n.webhookUrl');
  }

  /**
   * Send test webhook to n8n for integration testing
   */
  async sendTestWebhook(payload: WebhookPayloadDto): Promise<WebhookResponseDto> {
    const webhookData = {
      event: WebhookEvent.TEST_EVENT,
      timestamp: new Date().toISOString(),
      source: 'case-management-backend',
      data: payload,
    };

    try {
      this.logger.log(`Sending test webhook to n8n: ${this.n8nWebhookUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(this.n8nWebhookUrl, webhookData).pipe(
          timeout(5000),
          catchError((error) => {
            this.logger.error(`n8n test webhook failed: ${error.message}`);
            throw new HttpException(
              {
                error: 'WebhookServiceUnavailable',
                message: 'n8n webhook service is unavailable',
                details: error.response?.data || error.message,
              },
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      this.logger.log(`n8n test webhook successful: ${response.status}`);

      return {
        success: true,
        message: 'Test webhook sent to n8n successfully',
        timestamp: new Date().toISOString(),
        n8nResponse: {
          status: response.status,
          statusText: response.statusText,
        },
      };
    } catch (error) {
      this.logger.error(`Test webhook error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send business event webhook to n8n (non-blocking)
   * Used for actual business events like case creation, assignment, etc.
   */
  async sendBusinessWebhook(event: WebhookEvent, data: any): Promise<void> {
    const webhookData: BusinessWebhookDto = {
      event,
      data,
      source: 'case-management-backend',
    };

    const fullWebhookPayload = {
      ...webhookData,
      timestamp: new Date().toISOString(),
    };

    try {
      this.logger.log(`Sending business webhook: ${event}`);

      await firstValueFrom(
        this.httpService.post(this.n8nWebhookUrl, fullWebhookPayload).pipe(
          timeout(5000),
          catchError((error) => {
            this.logger.error(`Business webhook failed for ${event}: ${error.message}`, error.stack);
            // Don't throw error for business webhooks - they should be non-blocking
            return [];
          }),
        ),
      );

      this.logger.log(`Business webhook sent successfully: ${event}`);
    } catch (error) {
      this.logger.error(`Business webhook failed for ${event}: ${error.message}`, error.stack);
      // Business webhooks should not block the main application flow
    }
  }

  /**
   * Send case creation webhook
   */
  async sendCaseCreatedWebhook(caseData: any): Promise<void> {
    await this.sendBusinessWebhook(WebhookEvent.CASE_CREATED, {
      caseId: caseData.id,
      title: caseData.title,
      status: caseData.status,
      createdBy: caseData.createdBy,
      createdAt: caseData.createdAt,
    });
  }

  /**
   * Send case assignment webhook
   */
  async sendCaseAssignedWebhook(caseData: any, assigneeData: any): Promise<void> {
    await this.sendBusinessWebhook(WebhookEvent.CASE_ASSIGNED, {
      caseId: caseData.id,
      title: caseData.title,
      assignedTo: {
        id: assigneeData.id,
        email: assigneeData.email,
        name: assigneeData.name,
        role: assigneeData.role,
      },
      assignedAt: new Date().toISOString(),
    });
  }

  /**
   * Send case status change webhook
   */
  async sendCaseStatusChangedWebhook(caseData: any, oldStatus: string, newStatus: string): Promise<void> {
    await this.sendBusinessWebhook(WebhookEvent.CASE_STATUS_CHANGED, {
      caseId: caseData.id,
      title: caseData.title,
      oldStatus,
      newStatus,
      changedAt: new Date().toISOString(),
      changedBy: caseData.updatedBy,
    });
  }

  /**
   * Send case completion webhook
   */
  async sendCaseCompletedWebhook(caseData: any): Promise<void> {
    await this.sendBusinessWebhook(WebhookEvent.CASE_COMPLETED, {
      caseId: caseData.id,
      title: caseData.title,
      completedAt: caseData.completedAt,
      completedBy: caseData.completedBy,
      finalStatus: caseData.status,
    });
  }

  /**
   * Health check for webhook service
   */
  async checkWebhookHealth(): Promise<{ status: string; responseTime?: number }> {
    try {
      const start = Date.now();
      const healthPayload = {
        event: 'health_check',
        timestamp: new Date().toISOString(),
        source: 'case-management-backend',
        data: { check: true },
      };

      await firstValueFrom(
        this.httpService.post(this.n8nWebhookUrl, healthPayload).pipe(
          timeout(3000),
        ),
      );

      const responseTime = Date.now() - start;
      return {
        status: 'connected',
        responseTime,
      };
    } catch (error) {
      this.logger.warn(`Webhook health check failed: ${error.message}`);
      return {
        status: 'disconnected',
      };
    }
  }
}