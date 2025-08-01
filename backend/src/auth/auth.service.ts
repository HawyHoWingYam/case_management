import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, AuthResponseDto, ProfileDto, RefreshTokenDto } from './dto';
import { AuthenticatedUser } from './decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type?: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authenticate user with email and password
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    try {
      // Find user by email
      const user = await this.prismaService.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        this.logger.warn(`Login attempt with non-existent email: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!user.isActive) {
        this.logger.warn(`Login attempt with inactive account: ${email}`);
        throw new UnauthorizedException('Account is inactive. Please contact administrator.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for email: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      // Update last login timestamp
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      this.logger.log(`Successful login for user: ${email}`);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as any,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt || undefined,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login error for email ${email}:`, error.stack);
      throw new BadRequestException('Login failed. Please try again.');
    }
  }

  /**
   * Get user profile information
   */
  async getProfile(user: AuthenticatedUser): Promise<ProfileDto> {
    try {
      const userProfile = await this.prismaService.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });

      if (!userProfile) {
        throw new UnauthorizedException('User not found');
      }

      return {
        ...userProfile,
        role: userProfile.role as any,
        lastLoginAt: userProfile.lastLoginAt || undefined,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Profile retrieval error for user ${user.id}:`, error.stack);
      throw new BadRequestException('Failed to retrieve user profile');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify and decode refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as JwtPayload;

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Get current user information
      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Verify email matches
      if (user.email !== payload.email) {
        throw new UnauthorizedException('Token is invalid');
      }

      // Generate new tokens
      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      this.logger.log(`Token refreshed for user: ${user.email}`);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as any,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt || undefined,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Token refresh error:', error.stack);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Validate password against hash
   */
  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(payload: { sub: string; email: string; role: string }): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  }> {
    const accessTokenExpiry = this.configService.get<string>('JWT_EXPIRES_IN', '1h');
    const refreshTokenExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, type: 'access' },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: accessTokenExpiry,
        },
      ),
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshTokenExpiry,
        },
      ),
    ]);

    // Convert expiry to seconds (for 1h = 3600 seconds)
    const expiresIn = this.parseExpiryToSeconds(accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
    };
  }

  /**
   * Parse JWT expiry string to seconds
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // default 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 3600;
    }
  }
}