import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { WebhookPayloadDto, WebhookResponseDto } from './dto/webhook-payload.dto';

@ApiTags('Webhooks')
@Controller()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('n8n-test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Test n8n integration',
    description: 'Send a test webhook to n8n to verify integration is working correctly' 
  })
  @ApiBody({ 
    type: WebhookPayloadDto,
    description: 'Test payload to send to n8n'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Test webhook sent successfully', 
    type: WebhookResponseDto 
  })
  @ApiResponse({ 
    status: 503, 
    description: 'n8n webhook service unavailable' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid payload data' 
  })
  async testN8nIntegration(@Body() payload: WebhookPayloadDto): Promise<WebhookResponseDto> {
    return this.webhooksService.sendTestWebhook(payload);
  }
}