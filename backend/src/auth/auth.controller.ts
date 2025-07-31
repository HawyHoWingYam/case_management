import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpStatus,
  ClassSerializerInterceptor,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AuthResponse } from './interfaces/auth-response.interface';

@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<Pick<AuthResponse, 'accessToken' | 'refreshToken'>> {
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser('id') userId: string): Promise<{ message: string }> {
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return this.authService.getProfile(user.id);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
    return { message: 'Password reset successfully' };
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(
    @Body(ValidationPipe) verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    await this.authService.verifyEmail(verifyEmailDto.token);
    return { message: 'Email verified successfully' };
  }

  @Public()
  @Post('resend-verification')
  async resendVerification(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resendEmailVerification(forgotPasswordDto.email);
    return { message: 'Verification email sent successfully' };
  }
}