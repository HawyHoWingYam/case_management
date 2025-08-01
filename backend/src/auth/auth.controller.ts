import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({
    type: LoginDto,
    description: '登录凭据',
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '邮箱或密码错误',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '邮箱或密码错误' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({
    status: 200,
    description: '获取用户信息成功',
    schema: {
      type: 'object',
      properties: {
        user_id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'admin' },
        email: { type: 'string', example: 'admin@example.com' },
        role: { type: 'string', example: 'ADMIN' },
        is_active: { type: 'boolean', example: true },
        last_login: { type: 'string', example: '2025-08-01T10:30:00.000Z' },
        created_at: { type: 'string', example: '2025-08-01T09:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.user_id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({
    status: 200,
    description: '登出成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '登出成功' },
      },
    },
  })
  async logout() {
    // JWT 是无状态的，登出主要由前端处理（删除token）
    // 这里可以记录登出日志或处理其他业务逻辑
    return { message: '登出成功' };
  }
}