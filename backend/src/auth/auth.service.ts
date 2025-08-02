import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * 验证用户凭据
   */
  async validateUser(email: string, password: string): Promise<any> {
    try {
      // 查找用户
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        this.logger.warn(`Login attempt with non-existent email: ${email}`, 'VALIDATE_USER');
        return null;
      }

      if (!user.is_active) {
        this.logger.warn(`Login attempt with inactive user: ${email}`, 'VALIDATE_USER');
        throw new UnauthorizedException('账户已被禁用');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for user: ${email}`, 'VALIDATE_USER');
        return null;
      }

      // 移除密码字段
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(`Error validating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 生成 JWT payload
    const payload = { 
      sub: user.user_id, 
      email: user.email,
      username: user.username,
      role: user.role 
    };

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { user_id: user.user_id },
      data: { last_login: new Date() },
    });

    this.logger.log(`User logged in successfully: ${user.email}`, 'LOGIN');

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * 验证 JWT Token
   */
  async validateToken(payload: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { user_id: payload.sub },
        select: {
          user_id: true,
          username: true,
          email: true,
          role: true,
          is_active: true,
        },
      });

      if (!user || !user.is_active) {
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error(`Error validating token: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 哈希密码
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 获取用户信息
   */
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        last_login: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }

  // =================== 新增：用户管理方法 ===================

  /**
   * 获取所有用户（管理员功能）
   */
  async getAllUsers() {
    try {
      this.logger.log('Fetching all users', 'GET_ALL_USERS');
      
      const users = await this.prisma.user.findMany({
        select: {
          user_id: true,
          username: true,
          email: true,
          role: true,
          is_active: true,
          created_at: true,
          last_login: true,
        },
        orderBy: [
          { is_active: 'desc' },
          { created_at: 'desc' }
        ]
      });

      this.logger.log(`Retrieved ${users.length} users`, 'GET_ALL_USERS');
      return users;
    } catch (error) {
      this.logger.error(`Error fetching all users: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取 Caseworker 列表（带工作负载信息）
   */
  async getCaseworkers() {
    try {
      this.logger.log('Fetching caseworkers with workload info', 'GET_CASEWORKERS');

      // 获取所有活跃的 USER 角色用户
      const caseworkers = await this.prisma.user.findMany({
        where: {
          role: 'USER',
          is_active: true
        },
        select: {
          user_id: true,
          username: true,
          email: true,
          role: true,
          is_active: true,
          created_at: true,
          last_login: true,
        },
        orderBy: {
          username: 'asc'
        }
      });

      // 为每个 Caseworker 计算工作负载
      const caseworkersWithWorkload = await Promise.all(
        caseworkers.map(async (caseworker) => {
          const [totalCases, pendingCases, inProgressCases] = await Promise.all([
            // 总活跃案件数
            this.prisma.case.count({
              where: {
                assigned_to: caseworker.user_id,
                status: { in: ['PENDING', 'IN_PROGRESS'] }
              }
            }),
            
            // 待接受案件数
            this.prisma.case.count({
              where: {
                assigned_to: caseworker.user_id,
                status: 'PENDING'
              }
            }),
            
            // 进行中案件数
            this.prisma.case.count({
              where: {
                assigned_to: caseworker.user_id,
                status: 'IN_PROGRESS'
              }
            })
          ]);

          const workloadLimit = 5; // 业务规则：最多5个案件
          const canAcceptMore = totalCases < workloadLimit;

          return {
            ...caseworker,
            activeCases: totalCases,
            canAcceptMore,
            workload: {
              total: totalCases,
              pending: pendingCases,
              inProgress: inProgressCases,
              limit: workloadLimit
            }
          };
        })
      );

      // 按照可接受能力和工作负载排序
      const sortedCaseworkers = caseworkersWithWorkload.sort((a, b) => {
        // 优先显示可以接受更多案件的用户
        if (a.canAcceptMore && !b.canAcceptMore) return -1;
        if (!a.canAcceptMore && b.canAcceptMore) return 1;
        
        // 然后按活跃案件数排序
        return a.activeCases - b.activeCases;
      });

      this.logger.log(`Retrieved ${sortedCaseworkers.length} caseworkers with workload info`, 'GET_CASEWORKERS');
      
      return sortedCaseworkers;
    } catch (error) {
      this.logger.error(`Error fetching caseworkers: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 根据角色获取用户列表
   */
  async getUsersByRole(role: string) {
    try {
      this.logger.log(`Fetching users with role: ${role}`, 'GET_USERS_BY_ROLE');

      // 验证角色值
      const validRoles = ['ADMIN', 'MANAGER', 'USER'];
      if (!validRoles.includes(role.toUpperCase())) {
        throw new Error(`Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
      }

      const users = await this.prisma.user.findMany({
        where: {
          role: role.toUpperCase() as any,
          is_active: true
        },
        select: {
          user_id: true,
          username: true,
          email: true,
          role: true,
          is_active: true,
          created_at: true,
          last_login: true,
        },
        orderBy: {
          username: 'asc'
        }
      });

      this.logger.log(`Retrieved ${users.length} users with role ${role}`, 'GET_USERS_BY_ROLE');
      return users;
    } catch (error) {
      this.logger.error(`Error fetching users by role ${role}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取用户工作负载统计
   */
  async getUserWorkload(userId: number) {
    try {
      this.logger.log(`Fetching workload for user: ${userId}`, 'GET_USER_WORKLOAD');

      const [assignedCases, createdCases, completedCases] = await Promise.all([
        // 指派给用户的案件
        this.prisma.case.groupBy({
          by: ['status'],
          where: {
            assigned_to: userId
          },
          _count: {
            status: true
          }
        }),

        // 用户创建的案件
        this.prisma.case.count({
          where: {
            created_by: userId
          }
        }),

        // 用户完成的案件
        this.prisma.case.count({
          where: {
            assigned_to: userId,
            status: { in: ['RESOLVED', 'CLOSED'] }
          }
        })
      ]);

      // 处理分组结果
      const statusCounts = assignedCases.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      const workload = {
        assigned: {
          total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
          byStatus: statusCounts,
          pending: statusCounts['PENDING'] || 0,
          inProgress: statusCounts['IN_PROGRESS'] || 0,
        },
        created: createdCases,
        completed: completedCases,
        capacity: {
          current: (statusCounts['PENDING'] || 0) + (statusCounts['IN_PROGRESS'] || 0),
          limit: 5,
          available: Math.max(0, 5 - ((statusCounts['PENDING'] || 0) + (statusCounts['IN_PROGRESS'] || 0)))
        }
      };

      this.logger.log(`Retrieved workload for user ${userId}:`, workload);
      return workload;
    } catch (error) {
      this.logger.error(`Error fetching user workload: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 检查用户是否可以接受更多案件
   */
  async canUserAcceptMoreCases(userId: number): Promise<boolean> {
    try {
      const activeCaseCount = await this.prisma.case.count({
        where: {
          assigned_to: userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      });

      const canAccept = activeCaseCount < 5; // 业务规则：最多5个案件
      
      this.logger.log(`User ${userId} can accept more cases: ${canAccept} (current: ${activeCaseCount}/5)`, 'CAN_ACCEPT_MORE');
      
      return canAccept;
    } catch (error) {
      this.logger.error(`Error checking if user can accept more cases: ${error.message}`, error.stack);
      return false;
    }
  }
}