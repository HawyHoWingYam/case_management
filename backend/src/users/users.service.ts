import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    this.logger.log(`Creating user: ${createUserDto.email}`, 'CREATE_USER');

    // 检查邮箱和用户名是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { username: createUserDto.username },
        ],
      },
    });

    if (existingUser) {
      this.logger.error(`User creation failed: email or username already exists`, 'CREATE_USER');
      throw new ConflictException('邮箱或用户名已存在');
    }

    // 密码加密
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    // 移除密码字段
    const { password, ...result } = user;
    return result;
  }

  async findAll(query: UserQueryDto = {}): Promise<{
    users: Omit<User, 'password'>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, role, is_active, search, sort_by = 'created_at', sort_order = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(role && { role }),
      ...(is_active !== undefined && { is_active }),
      ...(search && {
        OR: [
          { username: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    this.logger.log(`Fetching users with filters: ${JSON.stringify(where)}`, 'FIND_ALL_USERS');

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort_by]: sort_order },
        select: {
          user_id: true,
          username: true,
          email: true,
          role: true,
          is_active: true,
          last_login: true,
          created_at: true,
          updated_at: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    this.logger.log(`Finding user by ID: ${id}`, 'FIND_USER');

    const user = await this.prisma.user.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      this.logger.error(`User not found: ${id}`, 'FIND_USER');
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`Finding user by email: ${email}`, 'FIND_USER_BY_EMAIL');
    
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByRole(role: Role): Promise<Omit<User, 'password'>[]> {
    this.logger.log(`Finding users by role: ${role}`, 'FIND_USERS_BY_ROLE');

    return this.prisma.user.findMany({
      where: { role, is_active: true },
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { username: 'asc' },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    this.logger.log(`Updating user: ${id}`, 'UPDATE_USER');

    // 检查用户是否存在
    await this.findOne(id);

    // 如果更新邮箱或用户名，检查是否已存在
    if (updateUserDto.email || updateUserDto.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          user_id: { not: id },
          OR: [
            ...(updateUserDto.email ? [{ email: updateUserDto.email }] : []),
            ...(updateUserDto.username ? [{ username: updateUserDto.username }] : []),
          ],
        },
      });

      if (existingUser) {
        this.logger.error(`User update failed: email or username already exists`, 'UPDATE_USER');
        throw new ConflictException('邮箱或用户名已存在');
      }
    }

    // 如果更新密码，进行加密
    const updateData = { ...updateUserDto };
    if (updateUserDto.password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    const user = await this.prisma.user.update({
      where: { user_id: id },
      data: updateData,
    });

    // 移除密码字段
    const { password, ...result } = user;
    return result;
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Removing user: ${id}`, 'REMOVE_USER');

    // 检查用户是否存在
    await this.findOne(id);

    // 软删除：设置为不活跃状态
    await this.prisma.user.update({
      where: { user_id: id },
      data: { is_active: false },
    });
  }

  async updateLastLogin(id: number): Promise<void> {
    this.logger.log(`Updating last login for user: ${id}`, 'UPDATE_LAST_LOGIN');

    await this.prisma.user.update({
      where: { user_id: id },
      data: { last_login: new Date() },
    });
  }

  async getUserWorkload(userId: number): Promise<{
    total: number;
    open: number;
    in_progress: number;
    pending: number;
    resolved: number;
    closed: number;
  }> {
    this.logger.log(`Getting workload for user: ${userId}`, 'GET_USER_WORKLOAD');

    const cases = await this.prisma.case.groupBy({
      by: ['status'],
      where: { assigned_to: userId },
      _count: { status: true },
    });

    const workload = {
      total: 0,
      open: 0,
      in_progress: 0,
      pending: 0,
      resolved: 0,
      closed: 0,
    };

    cases.forEach((item) => {
      const count = item._count.status;
      workload.total += count;
      
      switch (item.status) {
        case 'OPEN':
          workload.open = count;
          break;
        case 'IN_PROGRESS':
          workload.in_progress = count;
          break;
        case 'PENDING':
          workload.pending = count;
          break;
        case 'RESOLVED':
          workload.resolved = count;
          break;
        case 'CLOSED':
          workload.closed = count;
          break;
      }
    });

    return workload;
  }

  async getCaseworkersWithWorkload(): Promise<Array<{
    user_id: number;
    username: string;
    email: string;
    role: Role;
    is_active: boolean;
    activeCases: number;
    canAcceptMore: boolean;
    workload: {
      total: number;
      pending: number;
      inProgress: number;
      limit: number;
    };
  }>> {
    this.logger.log('Getting caseworkers with workload info', 'GET_CASEWORKERS_WITH_WORKLOAD');

    const caseworkers = await this.prisma.user.findMany({
      where: {
        role: { in: ['USER', 'MANAGER'] }, // 假设这些角色可以处理案件
        is_active: true,
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
      },
      orderBy: { username: 'asc' },
    });

    const caseworkersWithWorkload = await Promise.all(
      caseworkers.map(async (user) => {
        const workload = await this.getUserWorkload(user.user_id);
        const activeCases = workload.open + workload.in_progress + workload.pending;
        const caseLimit = 10; // 可以配置每个用户的案件处理限制

        return {
          ...user,
          activeCases,
          canAcceptMore: activeCases < caseLimit,
          workload: {
            total: workload.total,
            pending: workload.pending,
            inProgress: workload.in_progress,
            limit: caseLimit,
          },
        };
      }),
    );

    return caseworkersWithWorkload;
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}