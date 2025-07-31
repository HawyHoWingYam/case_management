import { Injectable, UnauthorizedException, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User, UserStatus } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthResponse } from './interfaces/auth-response.interface';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    this.logger.log(`Registering new user with email: ${registerDto.email}`);

    try {
      // Generate email verification token
      const emailVerificationToken = this.generateSecureToken();
      
      const user = await this.usersService.create({
        ...registerDto,
        emailVerificationToken,
      });
      
      // Send email verification
      await this.emailService.sendEmailVerificationEmail(user, emailVerificationToken);
      
      // Generate tokens (user can login but some features may be restricted until verified)
      const tokens = await this.generateTokens(user);
      
      // Update last login
      await this.usersService.updateLastLogin(user.id);

      this.logger.log(`User registered successfully: ${user.id}`);

      return {
        user,
        ...tokens,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Registration failed for email: ${registerDto.email}`, error instanceof Error ? error.stack : error);
      throw new Error('Registration failed');
    }
  }

  /**
   * Login user with email and password
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);

    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    // Update last login
    await this.usersService.updateLastLogin(user.id);

    this.logger.log(`User logged in successfully: ${user.id}`);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<Pick<AuthResponse, 'accessToken' | 'refreshToken'>> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);
      
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      this.logger.error('Refresh token validation failed', error instanceof Error ? error.stack : error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersService.findByEmailWithPassword(email);
      
      if (!user) {
        return null;
      }

      const isPasswordValid = await this.usersService.validatePassword(user, password);
      
      if (!isPasswordValid) {
        return null;
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      this.logger.error(`User validation failed for email: ${email}`, error instanceof Error ? error.stack : error);
      return null;
    }
  }

  /**
   * Validate JWT payload
   */
  async validateJwtPayload(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findOne(payload.sub);
    
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid token');
    }

    return user;
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User): Promise<Pick<AuthResponse, 'accessToken' | 'refreshToken'>> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logout user (invalidate tokens - in a real app you'd maintain a blacklist)
   */
  async logout(userId: string): Promise<void> {
    this.logger.log(`User logged out: ${userId}`);
    // In a production app, you might want to:
    // 1. Add token to blacklist
    // 2. Clear refresh token from database
    // 3. Log the logout event
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }

  /**
   * Verify user email
   */
  async verifyEmail(token: string): Promise<void> {
    this.logger.log(`Email verification requested with token: ${token}`);
    
    try {
      const user = await this.usersService.findByVerificationToken(token);
      
      if (!user) {
        throw new BadRequestException('Invalid verification token');
      }

      // Update user's emailVerified status and remove the verification token
      await this.usersService.update(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
      });

      this.logger.log(`Email verified successfully for user: ${user.id}`);
    } catch (error) {
      this.logger.error(`Email verification failed for token: ${token}`, error instanceof Error ? error.stack : error);
      throw new BadRequestException('Email verification failed');
    }
  }

  /**
   * Send password reset email
   */
  async forgotPassword(email: string): Promise<void> {
    this.logger.log(`Password reset requested for email: ${email}`);
    
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        this.logger.log(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      // Generate password reset token and set expiry
      const resetToken = this.generateSecureToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await this.usersService.update(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });

      // Send password reset email
      await this.emailService.sendPasswordResetEmail(user, resetToken);

      this.logger.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to: ${email}`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    this.logger.log(`Password reset attempt with token: ${token}`);
    
    try {
      const user = await this.usersService.findByResetToken(token);
      
      if (!user) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Check if token has expired
      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        throw new BadRequestException('Reset token has expired');
      }

      // Update user's password and remove reset token
      await this.usersService.update(user.id, {
        password: newPassword, // Will be hashed in the service
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      this.logger.log(`Password reset successfully for user: ${user.id}`);
    } catch (error) {
      this.logger.error(`Password reset failed for token: ${token}`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Generate a secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(email: string): Promise<void> {
    this.logger.log(`Resending email verification for: ${email}`);
    
    try {
      const user = await this.usersService.findByEmail(email);
      
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.emailVerified) {
        throw new BadRequestException('Email is already verified');
      }

      // Generate new verification token
      const emailVerificationToken = this.generateSecureToken();
      
      await this.usersService.update(user.id, {
        emailVerificationToken,
      });

      // Send verification email
      await this.emailService.sendEmailVerificationEmail(user, emailVerificationToken);

      this.logger.log(`Email verification resent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to resend email verification to: ${email}`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }
}