import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
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
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

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
    this.logger.log(`Login attempt for email: ${loginDto.email}`, 'LOGIN');
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
    this.logger.log(`Profile request for user: ${req.user.user_id}`, 'PROFILE');
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
  async logout(@Request() req) {
    this.logger.log(`Logout for user: ${req.user.user_id}`, 'LOGOUT');
    // JWT 是无状态的，登出主要由前端处理（删除token）
    // 这里可以记录登出日志或处理其他业务逻辑
    return { message: '登出成功' };
  }

  // =================== 新增：用户管理相关端点 ===================

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户列表（管理员功能）' })
  @ApiResponse({
    status: 200,
    description: '获取用户列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          user_id: { type: 'number', example: 1 },
          username: { type: 'string', example: 'john_doe' },
          email: { type: 'string', example: 'john@example.com' },
          role: { type: 'string', example: 'USER' },
          is_active: { type: 'boolean', example: true },
          created_at: { type: 'string', example: '2025-08-01T09:00:00.000Z' },
          last_login: { type: 'string', example: '2025-08-01T10:30:00.000Z', nullable: true },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  async getAllUsers(@Request() req) {
    this.logger.log(`Admin ${req.user.user_id} requesting all users`, 'GET_ALL_USERS');
    return this.authService.getAllUsers();
  }

  @Get('users/caseworkers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取Caseworker列表（用于案件指派）' })
  @ApiResponse({
    status: 200,
    description: '获取Caseworker列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          user_id: { type: 'number', example: 2 },
          username: { type: 'string', example: 'john_caseworker' },
          email: { type: 'string', example: 'john@company.com' },
          role: { type: 'string', example: 'USER' },
          is_active: { type: 'boolean', example: true },
          activeCases: { type: 'number', example: 3 },
          canAcceptMore: { type: 'boolean', example: true },
          workload: { 
            type: 'object',
            properties: {
              total: { type: 'number', example: 3 },
              pending: { type: 'number', example: 1 },
              inProgress: { type: 'number', example: 2 },
              limit: { type: 'number', example: 5 }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
  })
  async getCaseworkers(@Request() req) {
    this.logger.log(`Manager ${req.user.user_id} requesting caseworker list`, 'GET_CASEWORKERS');
    return this.authService.getCaseworkers();
  }

  @Get('users/by-role/:role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: '根据角色获取用户列表' })
  @ApiResponse({
    status: 200,
    description: '获取指定角色用户列表成功',
  })
  async getUsersByRole(@Request() req, @Param('role') role: string) {
    this.logger.log(`User ${req.user.user_id} requesting users with role: ${role}`, 'GET_USERS_BY_ROLE');
    return this.authService.getUsersByRole(role);
  }
}