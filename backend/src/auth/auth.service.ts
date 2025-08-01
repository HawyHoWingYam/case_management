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
        this.logger.warn(`Login attempt with non-existent email: ${email}`);
        return null;
      }

      if (!user.is_active) {
        this.logger.warn(`Login attempt with inactive user: ${email}`);
        throw new UnauthorizedException('账户已被禁用');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for user: ${email}`);
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

    this.logger.log(`User logged in successfully: ${user.email}`);

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
}