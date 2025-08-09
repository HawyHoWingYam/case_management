import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseQueryDto, CaseStatsQueryDto } from './dto/case-query.dto';
import { CaseStatus, Priority, Prisma, NotificationType } from '@prisma/client';
import { CaseActionResponseDto } from './dto/case-action-response.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  /**
   * 创建新案件
   */
  async create(createCaseDto: CreateCaseDto, createdBy: number) {
    try {
      // Debug: Log the received data
      this.logger.log(`Creating case with DTO: ${JSON.stringify(createCaseDto)}`, 'CREATE_CASE');
      this.logger.log(`assigned_to value: ${createCaseDto.assigned_to}, type: ${typeof createCaseDto.assigned_to}`, 'CREATE_CASE');
      
      // Debug: Detailed metadata logging
      if (createCaseDto.metadata) {
        this.logger.log(`Metadata received: ${JSON.stringify(createCaseDto.metadata)}`, 'CREATE_CASE');
        this.logger.log(`Metadata type: ${typeof createCaseDto.metadata}`, 'CREATE_CASE');
        this.logger.log(`Metadata keys: ${Object.keys(createCaseDto.metadata)}`, 'CREATE_CASE');
        
        if (createCaseDto.metadata.attachments) {
          this.logger.log(`Attachments found in metadata: ${createCaseDto.metadata.attachments.length} files`, 'CREATE_CASE');
          createCaseDto.metadata.attachments.forEach((attachment, index) => {
            this.logger.log(`Attachment ${index + 1}: ${JSON.stringify(attachment)}`, 'CREATE_CASE');
          });
        } else {
          this.logger.log(`No attachments found in metadata`, 'CREATE_CASE');
        }
      } else {
        this.logger.log(`No metadata provided`, 'CREATE_CASE');
      }
      
      // 如果指定了 assigned_to，验证用户是否存在
      if (createCaseDto.assigned_to) {
        const assignedUser = await this.prisma.user.findUnique({
          where: { user_id: createCaseDto.assigned_to },
        });

        if (!assignedUser || !assignedUser.is_active) {
          throw new NotFoundException('指派的用户不存在或已被禁用');
        }
      }

      const newCase = await this.prisma.case.create({
        data: {
          title: createCaseDto.title,
          description: createCaseDto.description,
          priority: createCaseDto.priority || Priority.MEDIUM,
          status: createCaseDto.assigned_to ? CaseStatus.PENDING : CaseStatus.OPEN, // 如果有指派则为 PENDING，否则为 OPEN
          created_by: createdBy,
          assigned_to: createCaseDto.assigned_to,
          metadata: createCaseDto.metadata,
        },
        include: {
          creator: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      // Debug: Log what was actually saved to database
      this.logger.log(`New case created with ID: ${newCase.case_id}`, 'CREATE_CASE');
      this.logger.log(`Case metadata stored in DB: ${JSON.stringify(newCase.metadata)}`, 'CREATE_CASE');
      this.logger.log(`Case metadata type: ${typeof newCase.metadata}`, 'CREATE_CASE');
      if (newCase.metadata) {
        this.logger.log(`Case metadata keys: ${Object.keys(newCase.metadata)}`, 'CREATE_CASE');
        const metadata = newCase.metadata as any;
        if (metadata.attachments) {
          this.logger.log(`Case has ${metadata.attachments.length} attachments in DB`, 'CREATE_CASE');
        }
      }

      // 创建案件日志
      await this.prisma.caseLog.create({
        data: {
          case_id: newCase.case_id,
          user_id: createdBy,
          action: '创建案件',
          details: `创建了新案件："${newCase.title}"`,
        },
      });

      // 如果创建时就有指派，添加指派日志和通知
      if (createCaseDto.assigned_to) {
        const assignedUser = await this.prisma.user.findUnique({
          where: { user_id: createCaseDto.assigned_to },
          select: { username: true }
        });
        
        await this.prisma.caseLog.create({
          data: {
            case_id: newCase.case_id,
            user_id: createdBy,
            action: '指派案件',
            details: `创建时将案件指派给 ${assignedUser?.username || 'Unknown'} (ID: ${createCaseDto.assigned_to})，状态变更为 PENDING`,
          },
        });

        // 🔔 发送指派通知
        try {
          await this.notificationsService.createCaseNotification(
            NotificationType.CASE_ASSIGNED,
            createCaseDto.assigned_to,
            newCase.case_id,
            createdBy,
          );
          this.logger.log(`Assignment notification sent for case ${newCase.case_id}`, 'CREATE_CASE');
        } catch (error) {
          this.logger.error(`Failed to send assignment notification: ${error.message}`, 'CREATE_CASE');
        }
      }

      this.logger.log(`New case created: ${newCase.case_id} by user ${createdBy}`, 'CREATE_CASE');

      // 映射字段名以匹配前端期望的格式
      return this.mapCaseFields(newCase);
    } catch (error) {
      this.logger.error(`Error creating case: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取案件列表（原有方法，保持兼容性）
   */
  async findAll(userId: number, userRole: string) {
    return this.findAllWithFilters({}, userId, userRole);
  }

  /**
   * 根据筛选条件获取案件列表（新的增强方法）
   */
  async findAllWithFilters(query: CaseQueryDto, userId: number, userRole: string) {
    try {
      const {
        view = 'all',
        status,
        priority,
        assignedTo,
        createdBy,
        search,
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        createdAfter,
        createdBefore,
        updatedAfter,
        updatedBefore,
        include = ['creator', 'assignee'],
      } = query;

      // 确保 page 和 limit 是数字类型
      const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;

      // 构建 where 条件
      const whereCondition = this.buildWhereCondition({
        view,
        status,
        priority,
        assignedTo,
        createdBy,
        search,
        createdAfter,
        createdBefore,
        updatedAfter,
        updatedBefore,
        userId,
        userRole,
      });

      // 构建 include 条件
      const includeCondition = this.buildIncludeCondition(include);

      // 构建排序条件
      const orderBy = this.buildOrderByCondition(sortBy, sortOrder);

      // 计算分页
      const skip = (pageNum - 1) * limitNum;

      // 执行查询
      const [cases, total] = await Promise.all([
        this.prisma.case.findMany({
          where: whereCondition,
          include: includeCondition,
          orderBy,
          skip,
          take: limitNum,
        }),
        this.prisma.case.count({
          where: whereCondition,
        }),
      ]);

      // 计算分页信息
      const totalPages = Math.ceil(total / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPreviousPage = pageNum > 1;

      // 映射字段名并构建响应
      const mappedCases = cases.map(caseItem => this.mapCaseFields(caseItem));

      // 获取可用的筛选选项
      const availableFilters = await this.getAvailableFilters(userId, userRole);

      return {
        data: mappedCases,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
        filters: {
          applied: {
            view,
            status,
            priority,
            assignedTo,
            createdBy,
            search,
          },
          available: availableFilters,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching cases with filters: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 根据ID获取案件详情
   */
  async findOne(id: number, userId: number, userRole: string) {
    try {
      const caseData = await this.prisma.case.findUnique({
        where: { case_id: id },
        include: {
          creator: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
          assignee: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
          case_logs: {
            include: {
              user: {
                select: {
                  user_id: true,
                  username: true,
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      if (!caseData) {
        throw new NotFoundException('案件不存在');
      }

      // Debug: Log retrieved case data for metadata debugging
      this.logger.log(`Retrieved case ${id} from database`, 'FETCH_CASE_DETAIL');
      this.logger.log(`Case metadata from DB: ${JSON.stringify(caseData.metadata)}`, 'FETCH_CASE_DETAIL');
      this.logger.log(`Case metadata type: ${typeof caseData.metadata}`, 'FETCH_CASE_DETAIL');
      if (caseData.metadata) {
        this.logger.log(`Case metadata keys: ${Object.keys(caseData.metadata)}`, 'FETCH_CASE_DETAIL');
        const metadata = caseData.metadata as any;
        if (metadata.attachments) {
          this.logger.log(`Case has ${metadata.attachments.length} attachments from DB`, 'FETCH_CASE_DETAIL');
          metadata.attachments.forEach((attachment, index) => {
            this.logger.log(`DB Attachment ${index + 1}: ${JSON.stringify(attachment)}`, 'FETCH_CASE_DETAIL');
          });
        } else {
          this.logger.log(`No attachments found in case metadata from DB`, 'FETCH_CASE_DETAIL');
        }
      } else {
        this.logger.log(`Case metadata is null/undefined from DB`, 'FETCH_CASE_DETAIL');
      }

      // 权限检查：普通用户只能查看自己相关的案件
      if (userRole === 'USER') {
        const canAccess =
          caseData.created_by === userId ||           // Cases created by them
          caseData.assigned_to === userId ||          // Cases assigned to them  
          caseData.assigned_to === null;              // Unassigned cases (can be picked up)

        if (!canAccess) {
          throw new ForbiddenException('没有权限访问此案件');
        }
      }

      // 映射字段名
      return this.mapCaseFields(caseData);
    } catch (error) {
      this.logger.error(`Error fetching case ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新案件信息
   */
  async update(id: number, updateCaseDto: UpdateCaseDto, userId: number, userRole: string) {
    try {
      // 先检查案件是否存在
      const existingCase = await this.findOne(id, userId, userRole);

      // 权限检查
      if (userRole === 'USER' && existingCase.created_by_id !== userId) {
        throw new ForbiddenException('没有权限修改此案件');
      }
      
      // ADMIN 只能修改未被指派的案件
      if (userRole === 'ADMIN' && existingCase.assigned_to_id) {
        throw new ForbiddenException('ADMIN 只能修改未被指派的案件');
      }
      
      // MANAGER 只能修改未被指派的案件
      if (userRole === 'MANAGER' && existingCase.assigned_to_id) {
        throw new ForbiddenException('MANAGER 只能修改未被指派的案件');
      }

      // 如果要更新 assigned_to，验证用户是否存在
      if (updateCaseDto.assigned_to) {
        const assignedUser = await this.prisma.user.findUnique({
          where: { user_id: updateCaseDto.assigned_to },
        });

        if (!assignedUser || !assignedUser.is_active) {
          throw new NotFoundException('指派的用户不存在或已被禁用');
        }
      }

      const updatedCase = await this.prisma.case.update({
        where: { case_id: id },
        data: {
          ...updateCaseDto,
          updated_at: new Date(),
        },
        include: {
          creator: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      // 创建更新日志
      const changes = Object.keys(updateCaseDto).map(key => {
        const oldValue = existingCase[key];
        const newValue = updateCaseDto[key];
        return `${key}: ${oldValue} → ${newValue}`;
      }).join(', ');

      await this.prisma.caseLog.create({
        data: {
          case_id: id,
          user_id: userId,
          action: '更新案件',
          details: `更新了案件信息：${changes}`,
        },
      });

      // 🔔 发送状态变更通知
      if (updateCaseDto.status && updateCaseDto.status !== existingCase.status) {
        try {
          // 通知相关用户（创建者和被指派者）
          const notificationTargets = [existingCase.created_by_id];
          if (existingCase.assigned_to_id && existingCase.assigned_to_id !== existingCase.created_by_id) {
            notificationTargets.push(existingCase.assigned_to_id);
          }

          for (const targetUserId of notificationTargets) {
            if (targetUserId !== userId) { // 不要给操作者发通知
              await this.notificationsService.createCaseNotification(
                NotificationType.CASE_STATUS_CHANGED,
                targetUserId,
                id,
                userId,
              );
            }
          }
          this.logger.log(`Status change notifications sent for case ${id}`, 'UPDATE_CASE');
        } catch (error) {
          this.logger.error(`Failed to send status change notification: ${error.message}`, 'UPDATE_CASE');
        }
      }

      this.logger.log(`Case ${id} updated by user ${userId}`, 'UPDATE_CASE');

      return this.mapCaseFields(updatedCase);
    } catch (error) {
      this.logger.error(`Error updating case ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 删除案件
   */
  async remove(id: number, userId: number, userRole: string) {
    try {
      // 检查案件是否存在和权限
      const existingCase = await this.findOne(id, userId, userRole);

      // 只有 ADMIN 或案件创建者可以删除案件
      if (userRole !== 'ADMIN' && existingCase.created_by_id !== userId) {
        throw new ForbiddenException('没有权限删除此案件');
      }

      // 物理删除案件（级联删除相关的日志记录）
      await this.prisma.case.delete({
        where: { case_id: id },
      });

      this.logger.log(`Case ${id} deleted by user ${userId}`, 'DELETE_CASE');

      return { message: '案件删除成功' };
    } catch (error) {
      this.logger.error(`Error deleting case ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取案件统计信息
   */
  async getStats(userId: number, userRole: string, period: string = 'month') {
    try {
      // 根据用户角色构建基础查询条件
      const baseWhere = this.getBaseWhereForRole(userId, userRole);

      // 时间范围
      const timeRange = this.getTimeRange(period);

      // 并行执行多个统计查询
      const [
        totalCases,
        pendingCases,
        inProgressCases,
        resolvedCases,
        urgentCases,
        myCases,
        assignedToMe,
        createdByMe,
        completedByMe,
        casesThisWeek,
        casesLastWeek,
        casesByStatus,
        casesByPriority,
      ] = await Promise.all([
        // 总案件数
        this.prisma.case.count({ where: baseWhere }),

        // 待处理案件
        this.prisma.case.count({
          where: { ...baseWhere, status: CaseStatus.PENDING }
        }),

        // 进行中案件
        this.prisma.case.count({
          where: { ...baseWhere, status: CaseStatus.IN_PROGRESS }
        }),

        // 已解决案件
        this.prisma.case.count({
          where: { ...baseWhere, status: CaseStatus.RESOLVED }
        }),

        // 紧急案件
        this.prisma.case.count({
          where: { ...baseWhere, priority: Priority.URGENT }
        }),

        // 我的案件（创建的或分配给我的）
        this.prisma.case.count({
          where: {
            OR: [
              { created_by: userId },
              { assigned_to: userId },
            ],
          },
        }),

        // 分配给我的案件
        this.prisma.case.count({
          where: { assigned_to: userId },
        }),

        // 我创建的案件
        this.prisma.case.count({
          where: { created_by: userId },
        }),

        // 我完成的案件
        this.prisma.case.count({
          where: {
            assigned_to: userId,
            status: { in: [CaseStatus.RESOLVED, CaseStatus.CLOSED] }
          },
        }),

        // 本周创建的案件
        this.prisma.case.count({
          where: {
            ...baseWhere,
            created_at: {
              gte: this.getWeekStart(),
            },
          },
        }),

        // 上周创建的案件
        this.prisma.case.count({
          where: {
            ...baseWhere,
            created_at: {
              gte: this.getLastWeekStart(),
              lt: this.getWeekStart(),
            },
          },
        }),

        // 按状态分组统计
        this.prisma.case.groupBy({
          by: ['status'],
          where: baseWhere,
          _count: { status: true },
        }),

        // 按优先级分组统计
        this.prisma.case.groupBy({
          by: ['priority'],
          where: baseWhere,
          _count: { priority: true },
        }),
      ]);

      // 计算完成率
      const completionRate = totalCases > 0 ? resolvedCases / totalCases : 0;

      // 计算平均解决时间（这里简化计算，实际可能需要更复杂的逻辑）
      const avgResolutionTime = await this.calculateAvgResolutionTime(baseWhere);

      return {
        overview: {
          totalCases,
          pendingCases,
          inProgressCases,
          resolvedCases,
          urgentCases,
        },
        personal: {
          myCases,
          assignedToMe,
          createdByMe,
          completedByMe,
        },
        team: userRole === 'ADMIN' || userRole === 'MANAGER' ? {
          teamCases: totalCases,
          teamMembers: await this.getTeamMemberCount(),
          teamCompletionRate: completionRate,
        } : undefined,
        trends: {
          casesThisWeek,
          casesLastWeek,
          completionRate,
          avgResolutionTime,
        },
        charts: {
          casesByStatus: casesByStatus.map(item => ({
            status: item.status,
            count: item._count.status,
          })),
          casesByPriority: casesByPriority.map(item => ({
            priority: item.priority,
            count: item._count.priority,
          })),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting case stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  // =================== 案件操作方法 ===================

  /**
   * Chair 指派案件給 Caseworker
   */
  async assignCase(caseId: number, assignedCaseworkerId: number, assigner: any): Promise<CaseActionResponseDto> {
    try {
      // 1. 檢查案件是否存在
      const existingCase = await this.prisma.case.findUnique({
        where: { case_id: caseId },
        include: {
          creator: { select: { user_id: true, username: true } },
          assignee: { select: { user_id: true, username: true } }
        }
      });

      if (!existingCase) {
        throw new NotFoundException('案件不存在');
      }

      // 2. 檢查案件狀態是否允許指派
      if (existingCase.status !== 'OPEN') {
        throw new BadRequestException(`案件當前狀態為 ${existingCase.status}，只有 OPEN 狀態的案件可以指派`);
      }

      // 3. 檢查被指派的用戶是否存在且為 Caseworker
      const caseworker = await this.prisma.user.findUnique({
        where: { user_id: assignedCaseworkerId }
      });

      if (!caseworker) {
        throw new NotFoundException('指派的用戶不存在');
      }

      if (!caseworker.is_active) {
        throw new BadRequestException('指派的用戶已被禁用');
      }

      if (caseworker.role !== 'USER') {
        throw new BadRequestException('只能將案件指派給 Caseworker (USER角色)');
      }

      // 4. 檢查 Caseworker 當前案件數量（預檢查）
      const activeCasesCount = await this.prisma.case.count({
        where: {
          assigned_to: assignedCaseworkerId,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      });

      if (activeCasesCount >= 5) {
        throw new BadRequestException(`該 Caseworker 已有 ${activeCasesCount} 個活躍案件，無法接受更多指派`);
      }

      // 5. 更新案件
      const updatedCase = await this.prisma.case.update({
        where: { case_id: caseId },
        data: {
          assigned_to: assignedCaseworkerId,
          status: 'PENDING', // 狀態變更為待接受
          updated_at: new Date()
        },
        include: {
          creator: { select: { user_id: true, username: true } },
          assignee: { select: { user_id: true, username: true } }
        }
      });

      // 6. 記錄操作日誌
      await this.prisma.caseLog.create({
        data: {
          case_id: caseId,
          user_id: assigner.user_id,
          action: '指派案件',
          details: `將案件指派給 ${caseworker.username} (ID: ${assignedCaseworkerId})`
        }
      });

      // 🔔 發送指派通知
      try {
        await this.notificationsService.createCaseNotification(
          NotificationType.CASE_ASSIGNED,
          assignedCaseworkerId,
          caseId,
          assigner.user_id,
        );
        this.logger.log(`Assignment notification sent for case ${caseId}`, 'ASSIGN_CASE');
      } catch (error) {
        this.logger.error(`Failed to send assignment notification: ${error.message}`, 'ASSIGN_CASE');
      }

      this.logger.log(`Case ${caseId} assigned to user ${assignedCaseworkerId} by ${assigner.user_id}`, 'ASSIGN_CASE');

      return {
        success: true,
        message: '案件指派成功',
        caseId,
        newStatus: 'PENDING'
      };
    } catch (error) {
      this.logger.error(`Error assigning case ${caseId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Caseworker 接受指派的案件
   */
  async acceptCase(caseId: number, caseworkerId: number): Promise<CaseActionResponseDto> {
    try {
      // 1. 檢查案件是否存在且指派給當前用戶
      const existingCase = await this.prisma.case.findUnique({
        where: { case_id: caseId },
        include: {
          creator: { select: { user_id: true, username: true } },
          assignee: { select: { user_id: true, username: true } }
        }
      });

      if (!existingCase) {
        throw new NotFoundException('案件不存在');
      }

      if (existingCase.assigned_to !== caseworkerId) {
        throw new ForbiddenException('此案件未指派給您');
      }

      if (existingCase.status !== 'PENDING') {
        throw new BadRequestException(`案件狀態為 ${existingCase.status}，只有 PENDING 狀態的案件可以接受`);
      }

      // 2. 檢查 Caseworker 當前處理的案件數量（業務規則：最多5個）
      const activeCount = await this.prisma.case.count({
        where: {
          assigned_to: caseworkerId,
          status: 'IN_PROGRESS'
        }
      });

      if (activeCount >= 5) {
        throw new BadRequestException(`您已有 ${activeCount} 個進行中的案件，無法接受更多案件（上限5個）`);
      }

      // 3. 更新案件狀態
      const updatedCase = await this.prisma.case.update({
        where: { case_id: caseId },
        data: {
          status: CaseStatus.IN_PROGRESS,
          updated_at: new Date()
        }
      });

      // 4. 記錄操作日誌
      await this.prisma.caseLog.create({
        data: {
          case_id: caseId,
          user_id: caseworkerId,
          action: '接受案件',
          details: 'Caseworker 接受了指派的案件'
        }
      });

      // 🔔 發送接受通知給創建者
      try {
        if (existingCase.created_by !== caseworkerId) {
          await this.notificationsService.createCaseNotification(
            NotificationType.CASE_ACCEPTED,
            existingCase.created_by,
            caseId,
            caseworkerId,
          );
        }
        this.logger.log(`Case acceptance notification sent for case ${caseId}`, 'ACCEPT_CASE');
      } catch (error) {
        this.logger.error(`Failed to send acceptance notification: ${error.message}`, 'ACCEPT_CASE');
      }

      this.logger.log(`Case ${caseId} accepted by user ${caseworkerId}`, 'ACCEPT_CASE');

      return {
        success: true,
        message: '案件接受成功',
        caseId,
        newStatus: 'IN_PROGRESS'
      };
    } catch (error) {
      this.logger.error(`Error accepting case ${caseId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Caseworker 拒絕指派的案件
   */
  async rejectCase(caseId: number, caseworkerId: number): Promise<CaseActionResponseDto> {
    try {
      // 1. 檢查案件是否存在且指派給當前用戶
      const existingCase = await this.prisma.case.findUnique({
        where: { case_id: caseId },
        include: {
          creator: { select: { user_id: true, username: true } },
          assignee: { select: { user_id: true, username: true } }
        }
      });

      if (!existingCase) {
        throw new NotFoundException('案件不存在');
      }

      if (existingCase.assigned_to !== caseworkerId) {
        throw new ForbiddenException('此案件未指派給您');
      }

      if (existingCase.status !== 'PENDING') {
        throw new BadRequestException(`案件狀態為 ${existingCase.status}，只有 PENDING 狀態的案件可以拒絕`);
      }

      // 2. 更新案件狀態，清空指派
      const updatedCase = await this.prisma.case.update({
        where: { case_id: caseId },
        data: {
          assigned_to: null,
          status: 'OPEN', // 狀態回到 OPEN，等待重新指派
          updated_at: new Date()
        }
      });

      // 3. 記錄操作日誌
      await this.prisma.caseLog.create({
        data: {
          case_id: caseId,
          user_id: caseworkerId,
          action: '拒絕案件',
          details: 'Caseworker 拒絕了指派的案件，案件狀態已回到 OPEN'
        }
      });

      // 🔔 發送拒絕通知給創建者
      try {
        if (existingCase.created_by !== caseworkerId) {
          await this.notificationsService.createCaseNotification(
            NotificationType.CASE_REJECTED,
            existingCase.created_by,
            caseId,
            caseworkerId,
          );
        }
        this.logger.log(`Case rejection notification sent for case ${caseId}`, 'REJECT_CASE');
      } catch (error) {
        this.logger.error(`Failed to send rejection notification: ${error.message}`, 'REJECT_CASE');
      }

      this.logger.log(`Case ${caseId} rejected by user ${caseworkerId}`, 'REJECT_CASE');

      return {
        success: true,
        message: '案件拒絕成功，已回到待指派狀態',
        caseId,
        newStatus: 'OPEN'
      };
    } catch (error) {
      this.logger.error(`Error rejecting case ${caseId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 獲取可指派的 Caseworker 列表
   */
  async getAvailableCaseworkers() {
    try {
      // 獲取所有活躍的 USER 角色用戶
      const caseworkers = await this.prisma.user.findMany({
        where: {
          role: 'USER',
          is_active: true
        },
        select: {
          user_id: true,
          username: true,
          email: true
        }
      });

      // 為每個 Caseworker 計算當前活躍案件數
      const caseworkersWithStats = await Promise.all(
        caseworkers.map(async (caseworker) => {
          const activeCases = await this.prisma.case.count({
            where: {
              assigned_to: caseworker.user_id,
              status: { in: ['PENDING', 'IN_PROGRESS'] }
            }
          });

          return {
            user_id: caseworker.user_id,
            username: caseworker.username,
            email: caseworker.email,
            activeCases,
            canAcceptMore: activeCases < 5
          };
        })
      );

      // 按照可接受能力和活躍案件數排序
      return caseworkersWithStats.sort((a, b) => {
        if (a.canAcceptMore && !b.canAcceptMore) return -1;
        if (!a.canAcceptMore && b.canAcceptMore) return 1;
        return a.activeCases - b.activeCases;
      });
    } catch (error) {
      this.logger.error(`Error getting available caseworkers: ${error.message}`, error.stack);
      throw error;
    }
  }

  // =================== 案件完成流程方法 ===================

  /**
   * Caseworker 請求完成案件
   */
  async requestCompletion(caseId: number, caseworkerId: number): Promise<CaseActionResponseDto> {
    try {
      this.logger.log(`Starting request completion for case ${caseId} by user ${caseworkerId}`, 'REQUEST_COMPLETION');

      // 1. 檢查案件是否存在且指派給當前用戶
      const existingCase = await this.prisma.case.findUnique({
        where: { case_id: caseId },
        include: {
          creator: { select: { user_id: true, username: true } },
          assignee: { select: { user_id: true, username: true } }
        }
      });

      if (!existingCase) {
        this.logger.error(`Case ${caseId} not found`, 'REQUEST_COMPLETION');
        throw new NotFoundException('案件不存在');
      }

      if (existingCase.assigned_to !== caseworkerId) {
        this.logger.error(`Case ${caseId} not assigned to user ${caseworkerId}`, 'REQUEST_COMPLETION');
        throw new ForbiddenException('此案件未指派給您');
      }

      if (existingCase.status !== CaseStatus.IN_PROGRESS) {
        this.logger.error(`Case ${caseId} status is ${existingCase.status}, cannot request completion`, 'REQUEST_COMPLETION');
        throw new BadRequestException(`案件狀態為 ${existingCase.status}，只有 IN_PROGRESS 狀態的案件可以請求完成`);
      }

      this.logger.log(`Case ${caseId} validation passed, updating status to PENDING_COMPLETION_REVIEW`, 'REQUEST_COMPLETION');

      // 2. 更新案件狀態
      const updatedCase = await this.prisma.case.update({
        where: { case_id: caseId },
        data: {
          status: CaseStatus.PENDING_COMPLETION_REVIEW,
          updated_at: new Date()
        }
      });

      this.logger.log(`Case ${caseId} status updated to PENDING_COMPLETION_REVIEW`, 'REQUEST_COMPLETION');

      // 3. 記錄操作日誌
      await this.prisma.caseLog.create({
        data: {
          case_id: caseId,
          user_id: caseworkerId,
          action: '請求完成',
          details: 'Caseworker 請求完成案件，等待 Chair 審批'
        }
      });

      this.logger.log(`Case log created for completion request for case ${caseId}`, 'REQUEST_COMPLETION');

      // 4. 發送通知給所有 Chair 使用增強的通知系統
      try {
        this.logger.log(`🔔 [CasesService] Sending completion request notifications for case ${caseId}`, 'REQUEST_COMPLETION');
        await this.notificationsService.createCompletionRequestNotification(caseId, caseworkerId);
        this.logger.log(`🔔 [CasesService] Completion request notifications sent successfully for case ${caseId}`, 'REQUEST_COMPLETION');
      } catch (error) {
        this.logger.error(`🔔 [CasesService] Failed to send completion request notifications: ${error.message}`, 'REQUEST_COMPLETION');
      }

      this.logger.log(`Case ${caseId} completion request completed successfully`, 'REQUEST_COMPLETION');

      return {
        success: true,
        message: '請求完成成功，等待 Chair 審批',
        caseId,
        newStatus: 'PENDING_COMPLETION_REVIEW'
      };
    } catch (error) {
      this.logger.error(`Error requesting completion for case ${caseId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Chair 批准完成案件
   */
  async approveCompletion(caseId: number, chairId: number): Promise<CaseActionResponseDto> {
    try {
      this.logger.log(`Starting approval for case ${caseId} by chair ${chairId}`, 'APPROVE_COMPLETION');

      // 1. 檢查案件是否存在
      const existingCase = await this.prisma.case.findUnique({
        where: { case_id: caseId },
        include: {
          creator: { select: { user_id: true, username: true } },
          assignee: { select: { user_id: true, username: true } }
        }
      });

      if (!existingCase) {
        this.logger.error(`Case ${caseId} not found`, 'APPROVE_COMPLETION');
        throw new NotFoundException('案件不存在');
      }

      if (existingCase.status !== CaseStatus.PENDING_COMPLETION_REVIEW) {
        this.logger.error(`Case ${caseId} status is ${existingCase.status}, cannot approve`, 'APPROVE_COMPLETION');
        throw new BadRequestException(`案件狀態為 ${existingCase.status}，只有 PENDING_COMPLETION_REVIEW 狀態的案件可以批准`);
      }

      this.logger.log(`Case ${caseId} validation passed, updating status to COMPLETED`, 'APPROVE_COMPLETION');

      // 2. 更新案件狀態並記錄完成時間
      const updatedCase = await this.prisma.case.update({
        where: { case_id: caseId },
        data: {
          status: CaseStatus.COMPLETED,
          updated_at: new Date(),
          // Note: We would need to add completed_at field to the schema to record completion time
          metadata: {
            ...existingCase.metadata as any,
            completed_at: new Date().toISOString(),
            completed_by: chairId
          }
        }
      });

      this.logger.log(`Case ${caseId} status updated to COMPLETED with completion timestamp`, 'APPROVE_COMPLETION');

      // 3. 記錄操作日誌
      await this.prisma.caseLog.create({
        data: {
          case_id: caseId,
          user_id: chairId,
          action: '批准完成',
          details: 'Chair 批准了案件完成請求，案件狀態變更為 COMPLETED'
        }
      });

      this.logger.log(`Case log created for approval of case ${caseId}`, 'APPROVE_COMPLETION');

      // 4. 發送通知給 Caseworker 和相關人員使用增強的通知系統
      try {
        this.logger.log(`🔔 [CasesService] Sending completion approval notifications for case ${caseId}`, 'APPROVE_COMPLETION');
        await this.notificationsService.createCompletionApprovalNotification(caseId, chairId, true);
        this.logger.log(`🔔 [CasesService] Completion approval notifications sent successfully for case ${caseId}`, 'APPROVE_COMPLETION');
      } catch (error) {
        this.logger.error(`🔔 [CasesService] Failed to send approval notification: ${error.message}`, 'APPROVE_COMPLETION');
      }

      this.logger.log(`Case ${caseId} approval completed successfully`, 'APPROVE_COMPLETION');

      return {
        success: true,
        message: '案件批准完成',
        caseId,
        newStatus: 'COMPLETED'
      };
    } catch (error) {
      this.logger.error(`Error approving completion for case ${caseId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Chair 拒絕完成案件
   */
  async rejectCompletion(caseId: number, chairId: number): Promise<CaseActionResponseDto> {
    try {
      this.logger.log(`Starting rejection for case ${caseId} by chair ${chairId}`, 'REJECT_COMPLETION');

      // 1. 檢查案件是否存在
      const existingCase = await this.prisma.case.findUnique({
        where: { case_id: caseId },
        include: {
          creator: { select: { user_id: true, username: true } },
          assignee: { select: { user_id: true, username: true } }
        }
      });

      if (!existingCase) {
        this.logger.error(`Case ${caseId} not found`, 'REJECT_COMPLETION');
        throw new NotFoundException('案件不存在');
      }

      if (existingCase.status !== CaseStatus.PENDING_COMPLETION_REVIEW) {
        this.logger.error(`Case ${caseId} status is ${existingCase.status}, cannot reject`, 'REJECT_COMPLETION');
        throw new BadRequestException(`案件狀態為 ${existingCase.status}，只有 PENDING_COMPLETION_REVIEW 狀態的案件可以拒絕`);
      }

      this.logger.log(`Case ${caseId} validation passed, updating status back to IN_PROGRESS`, 'REJECT_COMPLETION');

      // 2. 更新案件狀態回到 IN_PROGRESS
      const updatedCase = await this.prisma.case.update({
        where: { case_id: caseId },
        data: {
          status: CaseStatus.IN_PROGRESS,
          updated_at: new Date()
        }
      });

      this.logger.log(`Case ${caseId} status reverted to IN_PROGRESS`, 'REJECT_COMPLETION');

      // 3. 記錄操作日誌
      await this.prisma.caseLog.create({
        data: {
          case_id: caseId,
          user_id: chairId,
          action: '拒絕完成',
          details: 'Chair 拒絕了案件完成請求，案件狀態回到 IN_PROGRESS，需要 Caseworker 繼續處理'
        }
      });

      this.logger.log(`Case log created for rejection of case ${caseId}`, 'REJECT_COMPLETION');

      // 4. 發送通知給 Caseworker 和相關人員使用增強的通知系統
      try {
        this.logger.log(`🔔 [CasesService] Sending completion rejection notifications for case ${caseId}`, 'REJECT_COMPLETION');
        await this.notificationsService.createCompletionApprovalNotification(caseId, chairId, false);
        this.logger.log(`🔔 [CasesService] Completion rejection notifications sent successfully for case ${caseId}`, 'REJECT_COMPLETION');
      } catch (error) {
        this.logger.error(`🔔 [CasesService] Failed to send rejection notification: ${error.message}`, 'REJECT_COMPLETION');
      }

      this.logger.log(`Case ${caseId} rejection completed successfully`, 'REJECT_COMPLETION');

      return {
        success: true,
        message: '案件完成請求已拒絕，案件狀態回到進行中',
        caseId,
        newStatus: 'IN_PROGRESS'
      };
    } catch (error) {
      this.logger.error(`Error rejecting completion for case ${caseId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // =================== 案件日志方法 ===================

  /**
   * 添加案件日志
   */
  async addCaseLog(caseId: number, userId: number, logEntry: string) {
    try {
      this.logger.log(`Adding manual log to case ${caseId} by user ${userId}`, 'ADD_CASE_LOG');

      // 1. 檢查案件是否存在
      const existingCase = await this.prisma.case.findUnique({
        where: { case_id: caseId }
      });

      if (!existingCase) {
        this.logger.error(`Case ${caseId} not found`, 'ADD_CASE_LOG');
        throw new NotFoundException('案件不存在');
      }

      this.logger.log(`Case ${caseId} found, creating log entry`, 'ADD_CASE_LOG');

      // 2. 創建日志記錄
      const newLog = await this.prisma.caseLog.create({
        data: {
          case_id: caseId,
          user_id: userId,
          action: '手動備注',
          details: logEntry
        }
      });

      this.logger.log(`Log entry created with ID ${newLog.log_id} for case ${caseId}`, 'ADD_CASE_LOG');

      return {
        log_id: newLog.log_id,
        message: '日志添加成功'
      };
    } catch (error) {
      this.logger.error(`Error adding log to case ${caseId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 獲取案件日志列表
   */
  async getCaseLogs(caseId: number) {
    try {
      this.logger.log(`Fetching logs for case ${caseId}`, 'GET_CASE_LOGS');

      // 1. 檢查案件是否存在
      const existingCase = await this.prisma.case.findUnique({
        where: { case_id: caseId }
      });

      if (!existingCase) {
        this.logger.error(`Case ${caseId} not found`, 'GET_CASE_LOGS');
        throw new NotFoundException('案件不存在');
      }

      // 2. 獲取所有日志，按創建時間降序排列
      const logs = await this.prisma.caseLog.findMany({
        where: { case_id: caseId },
        include: {
          user: {
            select: {
              user_id: true,
              username: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      this.logger.log(`Found ${logs.length} logs for case ${caseId}`, 'GET_CASE_LOGS');

      return logs;
    } catch (error) {
      this.logger.error(`Error getting logs for case ${caseId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // =================== 私有辅助方法 ===================

  /**
   * 构建 WHERE 查询条件
   */
  private buildWhereCondition(params: any): Prisma.CaseWhereInput {
    const {
      view,
      status,
      priority,
      assignedTo,
      createdBy,
      search,
      createdAfter,
      createdBefore,
      updatedAfter,
      updatedBefore,
      userId,
      userRole,
    } = params;

    let whereCondition: Prisma.CaseWhereInput = {};

    // 根据视图类型构建基础条件
    switch (view) {
      case 'my_cases':
        if (userRole === 'USER') {
          // Case worker 的"我的案件"只包括被指派给自己的案件
          whereCondition.assigned_to = userId;
        } else {
          // ADMIN 和 MANAGER 的"我的案件"包括创建的和指派的
          whereCondition.OR = [
            { created_by: userId },
            { assigned_to: userId },
          ];
        }
        break;
      case 'assigned':
        whereCondition.assigned_to = userId;
        break;
      case 'created':
        whereCondition.created_by = userId;
        break;
      case 'team':
        if (userRole === 'MANAGER' || userRole === 'ADMIN') {
          // 团队案件逻辑，这里简化为所有案件
          // 实际应用中可能需要根据部门或团队关系筛选
        } else {
          whereCondition = this.getBaseWhereForRole(userId, userRole);
        }
        break;
      case 'urgent':
        whereCondition.priority = Priority.URGENT;
        break;
      case 'pending':
        whereCondition.status = CaseStatus.PENDING;
        break;
      case 'in_progress':
        whereCondition.status = CaseStatus.IN_PROGRESS;
        break;
      case 'resolved':
        whereCondition.status = CaseStatus.RESOLVED;
        break;
      case 'all':
      default:
        // 根据用户角色限制可见性
        if (userRole === 'USER') {
          // Case worker 只能看到自己被指派的案件和未被指派的案件
          whereCondition.OR = [
            { assigned_to: userId },  // 指派给自己的案件
            { assigned_to: null },    // 未被指派的案件
          ];
        }
        // ADMIN 和 MANAGER 可以查看所有案件
        break;
    }

    // 添加其他筛选条件
    if (status) {
      whereCondition.status = status;
    }

    if (priority) {
      whereCondition.priority = priority;
    }

    if (assignedTo) {
      whereCondition.assigned_to = assignedTo;
    }

    if (createdBy) {
      whereCondition.created_by = createdBy;
    }

    if (search) {
      whereCondition.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 时间范围筛选
    if (createdAfter || createdBefore) {
      whereCondition.created_at = {};
      if (createdAfter) {
        whereCondition.created_at.gte = new Date(createdAfter);
      }
      if (createdBefore) {
        whereCondition.created_at.lte = new Date(createdBefore);
      }
    }

    if (updatedAfter || updatedBefore) {
      whereCondition.updated_at = {};
      if (updatedAfter) {
        whereCondition.updated_at.gte = new Date(updatedAfter);
      }
      if (updatedBefore) {
        whereCondition.updated_at.lte = new Date(updatedBefore);
      }
    }

    return whereCondition;
  }

  /**
   * 构建 INCLUDE 查询条件
   */
  private buildIncludeCondition(include: string[] = []): Prisma.CaseInclude {
    const includeCondition: Prisma.CaseInclude = {};

    if (include.includes('creator')) {
      includeCondition.creator = {
        select: {
          user_id: true,
          username: true,
          email: true,
        },
      };
    }

    if (include.includes('logs')) {
      includeCondition.case_logs = {
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      };
    }

    return includeCondition;
  }

  /**
   * 构建排序条件
   */
  private buildOrderByCondition(sortBy: string, sortOrder: 'asc' | 'desc'): Prisma.CaseOrderByWithRelationInput {
    const validSortFields = ['created_at', 'updated_at', 'title', 'priority', 'status'];

    if (!validSortFields.includes(sortBy)) {
      sortBy = 'created_at';
    }

    return { [sortBy]: sortOrder };
  }

  /**
   * 根据用户角色获取基础查询条件
   */
  private getBaseWhereForRole(userId: number, userRole: string): Prisma.CaseWhereInput {
    if (userRole === 'USER') {
      // Case worker 只能看到：1. 自己被指派的案件 2. 未被指派的案件
      return {
        OR: [
          { assigned_to: userId }, // 指派给自己的案件
          { assigned_to: null },    // 未被指派的案件
        ],
      };
    }
    // ADMIN 和 MANAGER 可以查看所有案件
    return {};
  }

  /**
   * 获取可用的筛选选项
   */
  private async getAvailableFilters(userId: number, userRole: string) {
    const baseWhere = this.getBaseWhereForRole(userId, userRole);

    const [statuses, priorities, assignees, creators] = await Promise.all([
      // 可用状态
      this.prisma.case.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { status: true },
      }),

      // 可用优先级
      this.prisma.case.groupBy({
        by: ['priority'],
        where: baseWhere,
        _count: { priority: true },
      }),

      // 可分配的用户
      this.prisma.user.findMany({
        where: { is_active: true },
        select: { user_id: true, username: true },
        take: 50, // 限制数量
      }),

      // 创建者
      this.prisma.user.findMany({
        where: {
          is_active: true,
          cases: { some: baseWhere }
        },
        select: { user_id: true, username: true },
        take: 50,
      }),
    ]);

    return {
      statuses: statuses.map(item => ({
        value: item.status,
        label: this.getStatusLabel(item.status),
        count: item._count.status,
      })),
      priorities: priorities.map(item => ({
        value: item.priority,
        label: this.getPriorityLabel(item.priority),
        count: item._count.priority,
      })),
      assignees: assignees.map(user => ({
        id: user.user_id,
        name: user.username,
      })),
      creators: creators.map(user => ({
        id: user.user_id,
        name: user.username,
      })),
    };
  }

  /**
   * 辅助方法：获取状态标签
   */
  private getStatusLabel(status: CaseStatus): string {
    const labels = {
      [CaseStatus.OPEN]: '开放',
      [CaseStatus.IN_PROGRESS]: '进行中',
      [CaseStatus.PENDING]: '待处理',
      [CaseStatus.RESOLVED]: '已解决',
      [CaseStatus.CLOSED]: '已关闭',
    };
    return labels[status] || status;
  }

  /**
   * 辅助方法：获取优先级标签
   */
  private getPriorityLabel(priority: Priority): string {
    const labels = {
      [Priority.LOW]: '低',
      [Priority.MEDIUM]: '中',
      [Priority.HIGH]: '高',
      [Priority.URGENT]: '紧急',
    };
    return labels[priority] || priority;
  }

  /**
   * 获取时间范围
   */
  private getTimeRange(period: string) {
    const now = new Date();
    const ranges = {
      day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    };
    return ranges[period] || ranges.month;
  }

  /**
   * 获取本周开始时间
   */
  private getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  }

  /**
   * 获取上周开始时间
   */
  private getLastWeekStart(): Date {
    const weekStart = this.getWeekStart();
    return new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * 计算平均解决时间
   */
  private async calculateAvgResolutionTime(whereCondition: Prisma.CaseWhereInput): Promise<number> {
    // 这里简化实现，实际应用中可能需要更复杂的计算
    // 可能需要存储案件状态变更的时间戳
    return 2.5; // 返回固定值作为示例
  }

  /**
   * 获取团队成员数量
   */
  private async getTeamMemberCount(): Promise<number> {
    return this.prisma.user.count({
      where: { is_active: true },
    });
  }

  /**
   * 修改现有的 mapCaseFields 方法，确保包含 assignee 信息
   */
  private mapCaseFields(caseItem: any) {
    return {
      ...caseItem,
      id: caseItem.case_id, // 添加id映射
      created_by_id: caseItem.created_by,
      assigned_to_id: caseItem.assigned_to,
      created_by: caseItem.creator,
      assigned_to: caseItem.assignee, // 确保包含 assignee 信息
    };
  }
}