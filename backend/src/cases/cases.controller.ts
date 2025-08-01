import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { CreateCaseDto, CreateCaseResponseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('案件管理')
@Controller('cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('USER', 'MANAGER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建新案件' })
  @ApiBody({
    type: CreateCaseDto,
    description: '案件创建信息',
  })
  @ApiResponse({
    status: 201,
    description: '案件创建成功',
    type: CreateCaseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  @ApiResponse({
    status: 404,
    description: '指派的用户不存在',
  })
  async create(@Body() createCaseDto: CreateCaseDto, @Request() req) {
    return this.casesService.create(createCaseDto, req.user.user_id);
  }

  @Get()
  @ApiOperation({ summary: '获取案件列表' })
  @ApiResponse({
    status: 200,
    description: '获取案件列表成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          case_id: { type: 'number', example: 1 },
          title: { type: 'string', example: '系统登录问题处理' },
          description: { type: 'string', example: '用户反馈无法正常登录系统' },
          status: { type: 'string', example: 'OPEN' },
          priority: { type: 'string', example: 'MEDIUM' },
          created_by: { type: 'number', example: 1 },
          assigned_to: { type: 'number', example: 2, nullable: true },
          created_at: { type: 'string', example: '2025-08-01T10:30:00.000Z' },
          updated_at: { type: 'string', example: '2025-08-01T10:30:00.000Z' },
          creator: {
            type: 'object',
            properties: {
              user_id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
              username: { type: 'string', example: 'john_doe' },
              email: { type: 'string', example: 'john@example.com' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  async findAll(@Request() req) {
    return this.casesService.findAll(req.user.user_id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取案件详情' })
  @ApiParam({
    name: 'id',
    description: '案件ID (UUID)',
    type: 'string',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: '获取案件详情成功',
    schema: {
      type: 'object',
      properties: {
        case_id: { type: 'number', example: 1 },
        title: { type: 'string', example: '系统登录问题处理' },
        description: { type: 'string', example: '用户反馈无法正常登录系统' },
        status: { type: 'string', example: 'OPEN' },
        priority: { type: 'string', example: 'MEDIUM' },
        created_by: { type: 'number', example: 1 },
        assigned_to: { type: 'number', example: 2, nullable: true },
        created_at: { type: 'string', example: '2025-08-01T10:30:00.000Z' },
        updated_at: { type: 'string', example: '2025-08-01T10:30:00.000Z' },
        creator: {
          type: 'object',
          properties: {
            user_id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', example: 'john@example.com' },
          },
        },
        case_logs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              log_id: { type: 'number', example: 1 },
              case_id: { type: 'number', example: 1 },
              user_id: { type: 'number', example: 1 },
              action: { type: 'string', example: '创建案件' },
              details: { type: 'string', example: '创建了新案件："系统登录问题处理"' },
              created_at: { type: 'string', example: '2025-08-01T10:30:00.000Z' },
              user: {
                type: 'object',
                properties: {
                  user_id: { type: 'number', example: 1 },
                  username: { type: 'string', example: 'john_doe' },
                },
              },
            },
          },
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
    description: '没有权限访问此案件',
  })
  @ApiResponse({
    status: 404,
    description: '案件不存在',
  })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.casesService.findOne(+id, req.user.user_id, req.user.role);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('USER', 'MANAGER', 'ADMIN')
  @ApiOperation({ summary: '更新案件信息' })
  @ApiParam({
    name: 'id',
    description: '案件ID (UUID)',
    type: 'string',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: UpdateCaseDto,
    description: '案件更新信息',
  })
  @ApiResponse({
    status: 200,
    description: '案件更新成功',
    type: CreateCaseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  @ApiResponse({
    status: 403,
    description: '没有权限修改此案件',
  })
  @ApiResponse({
    status: 404,
    description: '案件不存在或指派的用户不存在',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCaseDto: UpdateCaseDto,
    @Request() req,
  ) {
    return this.casesService.update(+id, updateCaseDto, req.user.user_id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'USER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除案件' })
  @ApiParam({
    name: 'id',
    description: '案件ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '案件删除成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '案件删除成功' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  @ApiResponse({
    status: 403,
    description: '没有权限删除此案件',
  })
  @ApiResponse({
    status: 404,
    description: '案件不存在',
  })
  async remove(@Param('id') id: string, @Request() req) {
    return this.casesService.remove(+id, req.user.user_id, req.user.role);
  }
}