import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService, CreateNotificationDto, NotificationQueryDto } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('通知管理')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '获取用户通知列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'is_read', required: false, type: Boolean, description: '是否已读' })
  @ApiQuery({ name: 'type', required: false, enum: ['CASE_ASSIGNED', 'CASE_ACCEPTED', 'CASE_REJECTED', 'CASE_STATUS_CHANGED', 'CASE_PRIORITY_CHANGED', 'CASE_COMMENT_ADDED', 'SYSTEM_ANNOUNCEMENT'], description: '通知类型' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: '开始日期' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: '结束日期' })
  @ApiResponse({
    status: 200,
    description: '获取通知列表成功',
    schema: {
      type: 'object',
      properties: {
        notifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              notification_id: { type: 'number' },
              type: { type: 'string' },
              title: { type: 'string' },
              message: { type: 'string' },
              is_read: { type: 'boolean' },
              read_at: { type: 'string', nullable: true },
              created_at: { type: 'string' },
              sender: {
                type: 'object',
                properties: {
                  user_id: { type: 'number' },
                  username: { type: 'string' },
                  email: { type: 'string' },
                },
                nullable: true,
              },
              case: {
                type: 'object',
                properties: {
                  case_id: { type: 'number' },
                  title: { type: 'string' },
                  status: { type: 'string' },
                },
                nullable: true,
              },
            },
          },
        },
        total: { type: 'number' },
        unread: { type: 'number' },
      },
    },
  })
  async findAll(@Request() req, @Query() query: NotificationQueryDto) {
    this.logger.log(`User ${req.user.user_id} fetching notifications`, 'GET_NOTIFICATIONS');
    return this.notificationsService.findByUserId(req.user.user_id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取通知统计信息' })
  @ApiResponse({
    status: 200,
    description: '获取统计信息成功',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        unread: { type: 'number' },
        read: { type: 'number' },
        byType: {
          type: 'object',
          additionalProperties: { type: 'number' },
        },
      },
    },
  })
  async getStats(@Request() req) {
    this.logger.log(`User ${req.user.user_id} fetching notification stats`, 'GET_NOTIFICATION_STATS');
    return this.notificationsService.getStats(req.user.user_id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '标记通知为已读' })
  @ApiParam({ name: 'id', type: Number, description: '通知ID' })
  @ApiResponse({
    status: 200,
    description: '标记成功',
  })
  async markAsRead(@Request() req, @Param('id', ParseIntPipe) id: number) {
    this.logger.log(`User ${req.user.user_id} marking notification ${id} as read`, 'MARK_NOTIFICATION_READ');
    return this.notificationsService.markAsRead(id, req.user.user_id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '标记所有通知为已读' })
  @ApiResponse({
    status: 200,
    description: '标记成功',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    },
  })
  async markAllAsRead(@Request() req) {
    this.logger.log(`User ${req.user.user_id} marking all notifications as read`, 'MARK_ALL_NOTIFICATIONS_READ');
    return this.notificationsService.markAllAsRead(req.user.user_id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除通知' })
  @ApiParam({ name: 'id', type: Number, description: '通知ID' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  async delete(@Request() req, @Param('id', ParseIntPipe) id: number) {
    this.logger.log(`User ${req.user.user_id} deleting notification ${id}`, 'DELETE_NOTIFICATION');
    return this.notificationsService.delete(id, req.user.user_id);
  }

  // =================== 管理员功能 ===================

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '创建通知（管理员功能）' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
  })
  async create(@Request() req, @Body() createNotificationDto: CreateNotificationDto) {
    this.logger.log(`Admin ${req.user.user_id} creating notification`, 'CREATE_NOTIFICATION');
    return this.notificationsService.create({
      ...createNotificationDto,
      sender_id: req.user.user_id,
    });
  }

  @Post('system')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建系统通知（管理员功能）' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
  })
  async createSystemNotification(
    @Request() req,
    @Body() body: { title: string; message: string; user_ids?: number[] },
  ) {
    this.logger.log(`Admin ${req.user.user_id} creating system notification: "${body.title}"`, 'CREATE_SYSTEM_NOTIFICATION');
    await this.notificationsService.createSystemNotification(
      body.title,
      body.message,
      body.user_ids,
    );
    return { message: '系统通知创建成功' };
  }
}