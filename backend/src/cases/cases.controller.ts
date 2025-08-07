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
  BadRequestException,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { CreateCaseDto, CreateCaseResponseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseQueryDto } from './dto/case-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParseIntPipe } from '@nestjs/common';
import { AssignCaseDto } from './dto/assign-case.dto';
import { CaseActionResponseDto } from './dto/case-action-response.dto';

@ApiTags('案件管理')
@Controller('cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CasesController {
  private readonly logger = new Logger(CasesController.name);

  constructor(private readonly casesService: CasesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('USER', 'MANAGER', 'ADMIN') // 允许MANAGER创建案件以便指派
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
    this.logger.log(`Creating case by user ${req.user.user_id}`, 'CREATE_CASE');
    return this.casesService.create(createCaseDto, req.user.user_id);
  }

  @Get()
  @ApiOperation({ summary: '获取案件列表（支持视图和筛选）' })
  @ApiQuery({
    name: 'view',
    required: false,
    enum: ['all', 'my_cases', 'assigned', 'created', 'team', 'urgent', 'pending', 'in_progress', 'resolved'],
    description: '视图类型：all-所有案件, my_cases-我的案件, assigned-指派给我的, created-我创建的, team-团队案件, urgent-紧急案件, pending-待处理, in_progress-进行中, resolved-已解决',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'],
    description: '案件状态筛选',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    description: '优先级筛选',
  })
  @ApiQuery({
    name: 'assignedTo',
    required: false,
    type: 'number',
    description: '指派给的用户ID',
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: 'number',
    description: '创建者用户ID',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: 'string',
    description: '搜索关键词（搜索标题和描述）',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: '页码（从1开始）',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: '每页数量（默认20，最大100）',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['created_at', 'updated_at', 'title', 'priority', 'status'],
    description: '排序字段',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: '排序方向',
  })
  @ApiResponse({
    status: 200,
    description: '获取案件列表成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              case_id: { type: 'number', example: 1 },
              title: { type: 'string', example: '系统登录问题处理' },
              description: { type: 'string', example: '用户反馈无法正常登录系统' },
              status: { type: 'string', example: 'OPEN' },
              priority: { type: 'string', example: 'MEDIUM' },
              created_by_id: { type: 'number', example: 1 },
              assigned_to_id: { type: 'number', example: 2, nullable: true },
              created_at: { type: 'string', example: '2025-08-01T10:30:00.000Z' },
              updated_at: { type: 'string', example: '2025-08-01T10:30:00.000Z' },
              due_date: { type: 'string', example: '2025-08-01T10:30:00.000Z', nullable: true },
              created_by: {
                type: 'object',
                properties: {
                  user_id: { type: 'number', example: 1 },
                  username: { type: 'string', example: 'john_doe' },
                  email: { type: 'string', example: 'john@example.com' },
                },
              },
              assigned_to: {
                type: 'object',
                nullable: true,
                properties: {
                  user_id: { type: 'number', example: 2 },
                  username: { type: 'string', example: 'jane_doe' },
                  email: { type: 'string', example: 'jane@example.com' },
                },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            totalPages: { type: 'number', example: 5 },
            hasNextPage: { type: 'boolean', example: true },
            hasPreviousPage: { type: 'boolean', example: false },
          },
        },
        filters: {
          type: 'object',
          properties: {
            applied: { type: 'object' },
            available: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  async findAll(@Query() query: CaseQueryDto, @Request() req) {
    this.logger.log(`Fetching cases for user ${req.user.user_id} with view: ${query.view}`, 'FETCH_CASES');
    return this.casesService.findAllWithFilters(query, req.user.user_id, req.user.role);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取案件统计信息' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month', 'quarter', 'year'],
    description: '统计周期',
  })
  @ApiResponse({
    status: 200,
    description: '获取统计信息成功',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalCases: { type: 'number', example: 156 },
            pendingCases: { type: 'number', example: 23 },
            inProgressCases: { type: 'number', example: 45 },
            resolvedCases: { type: 'number', example: 88 },
            urgentCases: { type: 'number', example: 12 },
          },
        },
        personal: {
          type: 'object',
          properties: {
            myCases: { type: 'number', example: 15 },
            assignedToMe: { type: 'number', example: 8 },
            createdByMe: { type: 'number', example: 7 },
            completedByMe: { type: 'number', example: 23 },
          },
        },
        trends: {
          type: 'object',
          properties: {
            casesThisWeek: { type: 'number', example: 12 },
            casesLastWeek: { type: 'number', example: 8 },
            completionRate: { type: 'number', example: 0.85 },
            avgResolutionTime: { type: 'number', example: 2.5 },
          },
        },
      },
    },
  })
  async getStats(@Query('period') period: string = 'month', @Request() req) {
    this.logger.log(`Fetching stats for user ${req.user.user_id} with period: ${period}`, 'FETCH_STATS');
    return this.casesService.getStats(req.user.user_id, req.user.role, period);
  }

  @Get('available-caseworkers')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: '获取可指派的 Caseworker 列表' })
  @ApiResponse({
    status: 200,
    description: '成功获取 Caseworker 列表',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          user_id: { type: 'number', example: 2 },
          username: { type: 'string', example: 'john_caseworker' },
          email: { type: 'string', example: 'john@company.com' },
          activeCases: { type: 'number', example: 3 },
          canAcceptMore: { type: 'boolean', example: true }
        }
      }
    }
  })
  async getAvailableCaseworkers(@Request() req) {
    this.logger.log(`Fetching available caseworkers by user ${req.user.user_id}`, 'FETCH_CASEWORKERS');
    return this.casesService.getAvailableCaseworkers();
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取案件详情' })
  @ApiParam({
    name: 'id',
    description: '案件ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '获取案件详情成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        case_id: { type: 'number', example: 1 },
        title: { type: 'string', example: '系统登录问题处理' },
        description: { type: 'string', example: '用户反馈无法正常登录系统' },
        status: { type: 'string', example: 'OPEN' },
        priority: { type: 'string', example: 'MEDIUM' },
        created_by_id: { type: 'number', example: 1 },
        assigned_to_id: { type: 'number', example: 2, nullable: true },
        created_at: { type: 'string', example: '2025-08-01T10:30:00.000Z' },
        updated_at: { type: 'string', example: '2025-08-01T10:30:00.000Z' },
        due_date: { type: 'string', example: '2025-08-01T10:30:00.000Z', nullable: true },
        metadata: { type: 'object' },
        created_by: {
          type: 'object',
          properties: {
            user_id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', example: 'john@example.com' },
          },
        },
        assigned_to: {
          type: 'object',
          nullable: true,
          properties: {
            user_id: { type: 'number', example: 2 },
            username: { type: 'string', example: 'jane_doe' },
            email: { type: 'string', example: 'jane@example.com' },
          },
        },
        case_logs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
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
    const caseId = parseInt(id, 10);
    if (isNaN(caseId)) {
      throw new BadRequestException('案件ID必须是有效的数字');
    }
    this.logger.log(`Fetching case ${caseId} for user ${req.user.user_id}`, 'FETCH_CASE_DETAIL');
    return this.casesService.findOne(caseId, req.user.user_id, req.user.role);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('USER', 'MANAGER', 'ADMIN')
  @ApiOperation({ summary: '更新案件信息' })
  @ApiParam({
    name: 'id',
    description: '案件ID',
    type: 'number',
    example: 1,
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
    const caseId = parseInt(id, 10);
    if (isNaN(caseId)) {
      throw new BadRequestException('案件ID必须是有效的数字');
    }
    this.logger.log(`Updating case ${caseId} by user ${req.user.user_id}`, 'UPDATE_CASE');
    return this.casesService.update(caseId, updateCaseDto, req.user.user_id, req.user.role);
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
    const caseId = parseInt(id, 10);
    if (isNaN(caseId)) {
      throw new BadRequestException('案件ID必须是有效的数字');
    }
    this.logger.log(`Deleting case ${caseId} by user ${req.user.user_id}`, 'DELETE_CASE');
    return this.casesService.remove(caseId, req.user.user_id, req.user.role);
  }

  // =================== 案件状态流转操作 ===================

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER') // Chair 權限
  @ApiOperation({ summary: 'Chair 指派案件給 Caseworker' })
  @ApiParam({ name: 'id', description: '案件ID', type: 'number' })
  @ApiBody({ type: AssignCaseDto })
  @ApiResponse({
    status: 200,
    description: '案件指派成功',
    type: CaseActionResponseDto
  })
  @ApiResponse({
    status: 400,
    description: '業務邏輯錯誤或案件狀態不正確',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: '案件當前狀態為 IN_PROGRESS，只有 OPEN 狀態的案件可以指派' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '案件或用戶不存在' })
  async assignCase(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignCaseDto: AssignCaseDto,
    @Request() req,
  ): Promise<CaseActionResponseDto> {
    this.logger.log(`Assigning case ${id} to user ${assignCaseDto.assignedCaseworkerId} by ${req.user.user_id}`, 'ASSIGN_CASE');
    return this.casesService.assignCase(id, assignCaseDto.assignedCaseworkerId, req.user);
  }

  @Patch(':id/accept')
  @UseGuards(RolesGuard)
  @Roles('USER') // Caseworker 權限
  @ApiOperation({ summary: 'Caseworker 接受指派的案件' })
  @ApiParam({ name: 'id', description: '案件ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: '案件接受成功',
    type: CaseActionResponseDto
  })
  @ApiResponse({
    status: 400,
    description: '案件狀態不正確或已達5案件上限',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: '您已有 5 個進行中的案件，無法接受更多案件（上限5個）' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ status: 403, description: '案件未指派給當前用戶' })
  @ApiResponse({ status: 404, description: '案件不存在' })
  async acceptCase(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<CaseActionResponseDto> {
    this.logger.log(`User ${req.user.user_id} accepting case ${id}`, 'ACCEPT_CASE');
    return this.casesService.acceptCase(id, req.user.user_id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('USER') // Caseworker 權限
  @ApiOperation({ summary: 'Caseworker 拒絕指派的案件' })
  @ApiParam({ name: 'id', description: '案件ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: '案件拒絕成功',
    type: CaseActionResponseDto
  })
  @ApiResponse({
    status: 400,
    description: '案件狀態不正確',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: '案件狀態為 IN_PROGRESS，只有 PENDING 狀態的案件可以拒絕' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ status: 403, description: '案件未指派給當前用戶' })
  @ApiResponse({ status: 404, description: '案件不存在' })
  async rejectCase(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<CaseActionResponseDto> {
    this.logger.log(`User ${req.user.user_id} rejecting case ${id}`, 'REJECT_CASE');
    return this.casesService.rejectCase(id, req.user.user_id);
  }
}