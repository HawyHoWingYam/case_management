import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from './entities/user.entity';
import { UserRole } from '../common/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user with email: ${createUserDto.email}`);

    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Create user entity
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User created successfully with ID: ${savedUser.id}`);

    return savedUser;
  }

  /**
   * Find all users with optional filtering
   */
  async findAll(
    role?: UserRole,
    status?: UserStatus,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const where: FindOptionsWhere<User> = {};
    
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await this.userRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { users, total, page, limit };
  }

  /**
   * Find user by ID
   */
  async findOne(id: string): Promise<User> {
    this.logger.log(`Finding user with ID: ${id}`);

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Find user by email with password (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  /**
   * Update user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);

    const user = await this.findOne(id);

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Hash password if provided
    if (updateUserDto.password) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    // Update user
    await this.userRepository.update(id, updateUserDto);
    const updatedUser = await this.findOne(id);

    this.logger.log(`User updated successfully with ID: ${id}`);
    return updatedUser;
  }

  /**
   * Update user status
   */
  async updateStatus(id: string, status: UserStatus): Promise<User> {
    this.logger.log(`Updating user status to ${status} for ID: ${id}`);

    await this.userRepository.update(id, { status });
    return this.findOne(id);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  /**
   * Validate user password
   */
  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  /**
   * Remove user (soft delete by setting status to inactive)
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Deactivating user with ID: ${id}`);

    const user = await this.findOne(id);
    await this.userRepository.update(id, { status: UserStatus.INACTIVE });

    this.logger.log(`User deactivated successfully with ID: ${id}`);
  }

  /**
   * Count users by role
   */
  async countByRole(): Promise<Record<UserRole, number>> {
    const counts = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const result: Record<UserRole, number> = {} as Record<UserRole, number>;
    
    // Initialize all roles with 0
    Object.values(UserRole).forEach((role: UserRole) => {
      result[role] = 0;
    });

    counts.forEach(({ role, count }) => {
      if (role in UserRole) {
        result[role as UserRole] = parseInt(count, 10);
      }
    });

    return result;
  }

  /**
   * Get active users count
   */
  async getActiveUsersCount(): Promise<number> {
    return this.userRepository.count({
      where: { status: UserStatus.ACTIVE },
    });
  }

  /**
   * Find user by email verification token
   */
  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });
  }

  /**
   * Find user by password reset token
   */
  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { passwordResetToken: token },
    });
  }
}