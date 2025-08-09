import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationType, Notification, Role } from '@prisma/client';

export interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  message: string;
  recipient_id: number;
  sender_id?: number;
  case_id?: number;
  metadata?: any;
}

export interface NotificationQueryDto {
  page?: number;
  limit?: number;
  is_read?: boolean;
  type?: NotificationType;
  start_date?: string;
  end_date?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    this.logger.log(`Creating notification for user ${createNotificationDto.recipient_id}`, 'CREATE_NOTIFICATION');
    
    return this.prisma.notification.create({
      data: {
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        recipient_id: createNotificationDto.recipient_id,
        sender_id: createNotificationDto.sender_id,
        case_id: createNotificationDto.case_id,
        metadata: createNotificationDto.metadata,
      },
      include: {
        sender: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        case: {
          select: {
            case_id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  async findByUserId(
    userId: number,
    query: NotificationQueryDto = {},
  ): Promise<{ notifications: Notification[]; total: number; unread: number }> {
    const { page = 1, limit = 10, is_read, type, start_date, end_date } = query;
    const skip = (page - 1) * limit;

    const where = {
      recipient_id: userId,
      ...(is_read !== undefined && { is_read }),
      ...(type && { type }),
      ...(start_date && end_date && {
        created_at: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
      }),
    };

    this.logger.log(`Fetching notifications for user ${userId} with filters: ${JSON.stringify(where)}`, 'FIND_NOTIFICATIONS');

    const [notifications, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          sender: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
          case: {
            select: {
              case_id: true,
              title: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { recipient_id: userId, is_read: false },
      }),
    ]);

    return { notifications, total, unread };
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    this.logger.log(`Marking notification ${id} as read for user ${userId}`, 'MARK_READ');
    
    return this.prisma.notification.update({
      where: {
        notification_id: id,
        recipient_id: userId, // 确保用户只能标记自己的通知
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  async markAllAsRead(userId: number): Promise<{ count: number }> {
    this.logger.log(`Marking all notifications as read for user ${userId}`, 'MARK_ALL_READ');
    
    const result = await this.prisma.notification.updateMany({
      where: {
        recipient_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return { count: result.count };
  }

  async delete(id: number, userId: number): Promise<Notification> {
    this.logger.log(`Deleting notification ${id} for user ${userId}`, 'DELETE_NOTIFICATION');
    
    return this.prisma.notification.delete({
      where: {
        notification_id: id,
        recipient_id: userId, // 确保用户只能删除自己的通知
      },
    });
  }

  async getStats(userId: number): Promise<{
    total: number;
    unread: number;
    read: number;
    byType: Record<NotificationType, number>;
  }> {
    this.logger.log(`Getting notification stats for user ${userId}`, 'GET_STATS');
    
    const [total, unread, byType] = await Promise.all([
      this.prisma.notification.count({
        where: { recipient_id: userId },
      }),
      this.prisma.notification.count({
        where: { recipient_id: userId, is_read: false },
      }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { recipient_id: userId },
        _count: { type: true },
      }),
    ]);

    const typeStats: Record<NotificationType, number> = {} as any;
    byType.forEach((item) => {
      typeStats[item.type] = item._count.type;
    });

    return {
      total,
      unread,
      read: total - unread,
      byType: typeStats,
    };
  }

  // 系统通知方法
  async createSystemNotification(
    title: string,
    message: string,
    userIds?: number[],
  ): Promise<void> {
    this.logger.log(`Creating system notification: "${title}"`, 'CREATE_SYSTEM_NOTIFICATION');
    
    if (userIds && userIds.length > 0) {
      // 发送给指定用户
      const notifications = userIds.map((userId) => ({
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title,
        message,
        recipient_id: userId,
      }));

      await this.prisma.notification.createMany({
        data: notifications,
      });
    } else {
      // 发送给所有活跃用户
      const activeUsers = await this.prisma.user.findMany({
        where: { is_active: true },
        select: { user_id: true },
      });

      const notifications = activeUsers.map((user) => ({
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title,
        message,
        recipient_id: user.user_id,
      }));

      await this.prisma.notification.createMany({
        data: notifications,
      });
    }
  }

  // 案件相关通知方法
  async createCaseNotification(
    type: NotificationType,
    caseId: number,
    recipientId: number,
    senderId?: number,
    customMessage?: string,
  ): Promise<void> {
    this.logger.log(`🔔 [NotificationService] Creating case notification: type=${type}, case=${caseId}, recipient=${recipientId}`, 'CREATE_CASE_NOTIFICATION');
    
    const caseData = await this.prisma.case.findUnique({
      where: { case_id: caseId },
      include: {
        creator: { select: { username: true } },
        assignee: { select: { username: true } },
      },
    });

    if (!caseData) {
      this.logger.error(`🔔 [NotificationService] Case ${caseId} not found for notification`, 'CREATE_CASE_NOTIFICATION');
      return;
    }

    this.logger.debug(`🔔 [NotificationService] Case data loaded: ${JSON.stringify({ title: caseData.title, status: caseData.status, priority: caseData.priority })}`, 'CREATE_CASE_NOTIFICATION');

    let title = '';
    let message = customMessage || '';

    switch (type) {
      case NotificationType.CASE_ASSIGNED:
        title = '案件已分配';
        message = message || `案件 "${caseData.title}" 已分配给您`;
        break;
      case NotificationType.CASE_ACCEPTED:
        title = '案件已接受';
        message = message || `您的案件 "${caseData.title}" 已被接受`;
        break;
      case NotificationType.CASE_REJECTED:
        title = '案件已拒绝';
        message = message || `您的案件 "${caseData.title}" 已被拒绝`;
        break;
      case NotificationType.CASE_STATUS_CHANGED:
        title = '案件状态变更';
        message = message || `案件 "${caseData.title}" 的状态已更新为 ${caseData.status}`;
        break;
      case NotificationType.CASE_PRIORITY_CHANGED:
        title = '案件优先级变更';
        message = message || `案件 "${caseData.title}" 的优先级已更新为 ${caseData.priority}`;
        break;
      case NotificationType.CASE_COMMENT_ADDED:
        title = '新评论';
        message = message || `案件 "${caseData.title}" 有新的评论`;
        break;
      default:
        title = '案件通知';
        message = message || `案件 "${caseData.title}" 有更新`;
    }

    this.logger.log(`🔔 [NotificationService] Notification template: ${title} - ${message}`, 'CREATE_CASE_NOTIFICATION');

    await this.create({
      type,
      title,
      message,
      recipient_id: recipientId,
      sender_id: senderId,
      case_id: caseId,
      metadata: {
        case_title: caseData.title,
        case_status: caseData.status,
        case_priority: caseData.priority,
      },
    });

    this.logger.log(`🔔 [NotificationService] Case notification created successfully`, 'CREATE_CASE_NOTIFICATION');
  }

  // Stage 3 Goal 3: Enhanced notification methods for case completion workflow
  async createCompletionRequestNotification(caseId: number, caseworkerId: number): Promise<void> {
    this.logger.log(`🔔 [NotificationService] Creating completion request notification for case ${caseId} from caseworker ${caseworkerId}`, 'CREATE_COMPLETION_REQUEST');
    
    // Get all Chair users
    const chairUsers = await this.prisma.user.findMany({
      where: { role: Role.ADMIN, is_active: true },
      select: { user_id: true, username: true },
    });

    this.logger.debug(`🔔 [NotificationService] Found ${chairUsers.length} Chair users to notify`, 'CREATE_COMPLETION_REQUEST');

    const caseData = await this.prisma.case.findUnique({
      where: { case_id: caseId },
      include: {
        assignee: { select: { username: true } },
      },
    });

    if (!caseData) {
      this.logger.error(`🔔 [NotificationService] Case ${caseId} not found for completion request notification`, 'CREATE_COMPLETION_REQUEST');
      return;
    }

    // Create notifications for all Chair users
    for (const chair of chairUsers) {
      this.logger.debug(`🔔 [NotificationService] Creating completion request notification for Chair ${chair.user_id} (${chair.username})`, 'CREATE_COMPLETION_REQUEST');
      
      await this.create({
        type: NotificationType.CASE_STATUS_CHANGED,
        title: '案件完成审批请求',
        message: `案件 "${caseData.title}" 已由 ${caseData.assignee?.username || 'Caseworker'} 请求完成，等待您的审批`,
        recipient_id: chair.user_id,
        sender_id: caseworkerId,
        case_id: caseId,
        metadata: {
          case_title: caseData.title,
          case_status: caseData.status,
          action_type: 'COMPLETION_REQUEST',
          caseworker_name: caseData.assignee?.username,
          notification_link: `/cases/${caseId}`,
        },
      });
    }

    this.logger.log(`🔔 [NotificationService] Completion request notifications sent to ${chairUsers.length} Chair users`, 'CREATE_COMPLETION_REQUEST');
  }

  async createCompletionApprovalNotification(caseId: number, chairId: number, approved: boolean): Promise<void> {
    const action = approved ? 'approved' : 'rejected';
    this.logger.log(`🔔 [NotificationService] Creating completion ${action} notification for case ${caseId} from chair ${chairId}`, 'CREATE_COMPLETION_APPROVAL');
    
    const caseData = await this.prisma.case.findUnique({
      where: { case_id: caseId },
      include: {
        assignee: { select: { user_id: true, username: true } },
        creator: { select: { user_id: true, username: true } },
      },
    });

    if (!caseData) {
      this.logger.error(`🔔 [NotificationService] Case ${caseId} not found for completion ${action} notification`, 'CREATE_COMPLETION_APPROVAL');
      return;
    }

    const chairUser = await this.prisma.user.findUnique({
      where: { user_id: chairId },
      select: { username: true },
    });

    const title = approved ? '案件已批准完成' : '案件完成被拒绝';
    const message = approved 
      ? `您的案件 "${caseData.title}" 已由 ${chairUser?.username || 'Chair'} 批准完成`
      : `您的案件 "${caseData.title}" 的完成请求已被 ${chairUser?.username || 'Chair'} 拒绝`;

    // Notify the assigned caseworker
    if (caseData.assignee) {
      this.logger.debug(`🔔 [NotificationService] Notifying caseworker ${caseData.assignee.user_id} about completion ${action}`, 'CREATE_COMPLETION_APPROVAL');
      
      await this.create({
        type: approved ? NotificationType.CASE_STATUS_CHANGED : NotificationType.CASE_REJECTED,
        title,
        message,
        recipient_id: caseData.assignee.user_id,
        sender_id: chairId,
        case_id: caseId,
        metadata: {
          case_title: caseData.title,
          case_status: caseData.status,
          action_type: approved ? 'COMPLETION_APPROVED' : 'COMPLETION_REJECTED',
          chair_name: chairUser?.username,
          notification_link: `/cases/${caseId}`,
        },
      });
    }

    // Also notify the case creator if different from assignee
    if (caseData.creator && caseData.creator.user_id !== caseData.assignee?.user_id) {
      this.logger.debug(`🔔 [NotificationService] Notifying case creator ${caseData.creator.user_id} about completion ${action}`, 'CREATE_COMPLETION_APPROVAL');
      
      await this.create({
        type: approved ? NotificationType.CASE_STATUS_CHANGED : NotificationType.CASE_REJECTED,
        title,
        message: approved 
          ? `案件 "${caseData.title}" 已由 ${chairUser?.username || 'Chair'} 批准完成`
          : `案件 "${caseData.title}" 的完成请求已被 ${chairUser?.username || 'Chair'} 拒绝`,
        recipient_id: caseData.creator.user_id,
        sender_id: chairId,
        case_id: caseId,
        metadata: {
          case_title: caseData.title,
          case_status: caseData.status,
          action_type: approved ? 'COMPLETION_APPROVED' : 'COMPLETION_REJECTED',
          chair_name: chairUser?.username,
          notification_link: `/cases/${caseId}`,
        },
      });
    }

    this.logger.log(`🔔 [NotificationService] Completion ${action} notifications sent successfully`, 'CREATE_COMPLETION_APPROVAL');
  }

  // Enhanced notification template system
  getNotificationTemplate(type: NotificationType, context: any): { title: string; message: string } {
    this.logger.debug(`🔔 [NotificationService] Getting template for type ${type} with context ${JSON.stringify(context)}`, 'GET_TEMPLATE');
    
    const templates = {
      [NotificationType.CASE_ASSIGNED]: {
        title: '案件已分配',
        message: `案件 "${context.case_title}" 已分配给您`,
      },
      [NotificationType.CASE_ACCEPTED]: {
        title: '案件已接受',
        message: `您的案件 "${context.case_title}" 已被 ${context.assignee_name} 接受`,
      },
      [NotificationType.CASE_REJECTED]: {
        title: '案件已拒绝',
        message: `您的案件 "${context.case_title}" 已被拒绝`,
      },
      [NotificationType.CASE_STATUS_CHANGED]: {
        title: '案件状态变更',
        message: `案件 "${context.case_title}" 的状态已更新为 ${context.new_status}`,
      },
      [NotificationType.CASE_PRIORITY_CHANGED]: {
        title: '案件优先级变更',
        message: `案件 "${context.case_title}" 的优先级已更新为 ${context.new_priority}`,
      },
      [NotificationType.CASE_COMMENT_ADDED]: {
        title: '新评论',
        message: `案件 "${context.case_title}" 有新的评论`,
      },
      [NotificationType.SYSTEM_ANNOUNCEMENT]: {
        title: context.title || '系统公告',
        message: context.message || '系统有重要更新',
      },
    };

    const template = templates[type] || {
      title: '通知',
      message: context.message || '您有新的通知',
    };

    this.logger.debug(`🔔 [NotificationService] Template generated: ${JSON.stringify(template)}`, 'GET_TEMPLATE');
    return template;
  }

  // Batch notification operations
  async markMultipleAsRead(notificationIds: number[], userId: number): Promise<{ count: number }> {
    this.logger.log(`🔔 [NotificationService] Marking ${notificationIds.length} notifications as read for user ${userId}`, 'MARK_MULTIPLE_READ');
    
    const result = await this.prisma.notification.updateMany({
      where: {
        notification_id: { in: notificationIds },
        recipient_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    this.logger.log(`🔔 [NotificationService] Marked ${result.count} notifications as read`, 'MARK_MULTIPLE_READ');
    return { count: result.count };
  }

  async deleteMultiple(notificationIds: number[], userId: number): Promise<{ count: number }> {
    this.logger.log(`🔔 [NotificationService] Deleting ${notificationIds.length} notifications for user ${userId}`, 'DELETE_MULTIPLE');
    
    const result = await this.prisma.notification.deleteMany({
      where: {
        notification_id: { in: notificationIds },
        recipient_id: userId,
      },
    });

    this.logger.log(`🔔 [NotificationService] Deleted ${result.count} notifications`, 'DELETE_MULTIPLE');
    return { count: result.count };
  }
}