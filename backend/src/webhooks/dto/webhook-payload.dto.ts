import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { WebhookEvent } from '../../common/enums';

export class WebhookPayloadDto {
  @ApiProperty({ example: 'Test message from Case Management System' })
  @IsString()
  message: string;

  @ApiProperty({ 
    example: { userId: '123', caseId: '456' }, 
    description: 'Additional test data',
    required: false 
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiProperty({ 
    example: 'test', 
    description: 'Test event type',
    required: false 
  })
  @IsOptional()
  @IsString()
  eventType?: string;
}

export class WebhookResponseDto {
  @ApiProperty({ example: true, description: 'Whether the webhook was sent successfully' })
  success: boolean;

  @ApiProperty({ example: 'Webhook sent to n8n successfully' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({
    description: 'n8n response details',
    type: 'object',
    properties: {
      status: { type: 'number', example: 200 },
      statusText: { type: 'string', example: 'OK' },
    },
  })
  n8nResponse: {
    status: number;
    statusText: string;
  };
}

export class BusinessWebhookDto {
  @ApiProperty({ 
    enum: WebhookEvent,
    example: WebhookEvent.CASE_CREATED,
    description: 'Business event type' 
  })
  @IsEnum(WebhookEvent)
  event: WebhookEvent;

  @ApiProperty({ 
    example: { caseId: '123', userId: '456', status: 'NEW' },
    description: 'Business event data' 
  })
  @IsObject()
  data: Record<string, any>;

  @ApiProperty({ 
    example: 'case-management-backend',
    description: 'Source system identifier',
    required: false 
  })
  @IsOptional()
  @IsString()
  source?: string;
}