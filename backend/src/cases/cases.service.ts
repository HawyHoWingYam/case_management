import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseStatus, Priority } from '@prisma/client';

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 创建新案件
   */
  async create(createCaseDto: CreateCaseDto, createdBy: number) {
    try {
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
          status: CaseStatus.OPEN, // 默认状态为 OPEN
          created_by: createdBy,
          assigned_to: createCaseDto.assigned_to,
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

      // 创建案件日志
      await this.prisma.caseLog.create({
        data: {
          case_id: newCase.case_id,
          user_id: createdBy,
          action: '创建案件',
          details: `创建了新案件："${newCase.title}"`,
        },
      });

      this.logger.log(`New case created: ${newCase.case_id} by user ${createdBy}`);

      return newCase;
    } catch (error) {
      this.logger.error(`Error creating case: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取案件列表
   */
  async findAll(userId: number, userRole: string) {
    try {
      // 根据用户角色决定可以查看的案件
      let whereCondition = {};

      if (userRole === 'USER') {
        // 普通用户只能查看自己创建的或分配给自己的案件
        whereCondition = {
          OR: [
            { created_by: userId },
            { assigned_to: userId },
          ],
        };
      }
      // ADMIN 和 MANAGER 可以查看所有案件，所以不添加条件

      const cases = await this.prisma.case.findMany({
        where: whereCondition,
        include: {
          creator: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return cases;
    } catch (error) {
      this.logger.error(`Error fetching cases: ${error.message}`, error.stack);
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

      // 权限检查：普通用户只能查看自己相关的案件
      if (userRole === 'USER') {
        const canAccess = 
          caseData.created_by === userId || 
          caseData.assigned_to === userId;

        if (!canAccess) {
          throw new ForbiddenException('没有权限访问此案件');
        }
      }

      return caseData;
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

      // 权限检查：普通用户只能更新自己创建的案件
      if (userRole === 'USER' && existingCase.created_by !== userId) {
        throw new ForbiddenException('没有权限修改此案件');
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
        data: updateCaseDto,
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

      this.logger.log(`Case ${id} updated by user ${userId}`);

      return updatedCase;
    } catch (error) {
      this.logger.error(`Error updating case ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 删除案件（软删除或物理删除）
   */
  async remove(id: number, userId: number, userRole: string) {
    try {
      // 检查案件是否存在和权限
      const existingCase = await this.findOne(id, userId, userRole);

      // 只有 ADMIN 或案件创建者可以删除案件
      if (userRole !== 'ADMIN' && existingCase.created_by !== userId) {
        throw new ForbiddenException('没有权限删除此案件');
      }

      // 物理删除案件（级联删除相关的日志记录）
      await this.prisma.case.delete({
        where: { case_id: id },
      });

      this.logger.log(`Case ${id} deleted by user ${userId}`);

      return { message: '案件删除成功' };
    } catch (error) {
      this.logger.error(`Error deleting case ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}