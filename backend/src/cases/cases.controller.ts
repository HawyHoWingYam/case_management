import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
  ValidationPipe,
  DefaultValuePipe,
  ParseIntPipe,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseStatusDto } from './dto/update-case-status.dto';
import { AssignCaseDto } from './dto/assign-case.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Case } from './entities/case.entity';
import { CaseLog } from '../entities/case-log.entity';
import { UserRole, CaseStatus } from '../common/enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('cases')
export class CasesController {
  private readonly logger = new Logger(CasesController.name);

  constructor(private readonly casesService: CasesService) {}

  /**
   * Create a new case
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.CHAIR, UserRole.CASEWORKER, UserRole.SUPERVISOR, UserRole.CLIENT)
  async create(
    @Body(ValidationPipe) createCaseDto: CreateCaseDto,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; data: Case; message: string }> {
    this.logger.log(`Creating case: ${createCaseDto.title} by user ${user.id}`);
    
    const case_ = await this.casesService.create(createCaseDto, user);
    
    return {
      success: true,
      data: case_,
      message: 'Case created successfully',
    };
  }

  /**
   * Get all cases with pagination and filtering
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.CHAIR, UserRole.CASEWORKER, UserRole.SUPERVISOR, UserRole.CLERK)
  async findAll(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('status') status?: CaseStatus,
  ): Promise<{
    success: boolean;
    data: Case[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    this.logger.log(`Fetching cases - page: ${page}, limit: ${limit}, status: ${status || 'all'} by user ${user.id}`);
    
    const result = await this.casesService.findAll({ page, limit, status });
    
    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Get a specific case by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CHAIR, UserRole.CASEWORKER, UserRole.SUPERVISOR, UserRole.CLERK, UserRole.CLIENT)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; data: Case }> {
    this.logger.log(`Fetching case ${id} by user ${user.id}`);
    
    const case_ = await this.casesService.findOne(id);
    
    // Clients can only view their own cases
    if (user.role === UserRole.CLIENT && case_.clientId !== user.id) {
      this.logger.warn(`Client ${user.id} attempted to access case ${id} which is not theirs`);
      throw new ForbiddenException('You can only access your own cases');
    }
    
    return {
      success: true,
      data: case_,
    };
  }

  /**
   * Assign a case to a caseworker
   */
  @Patch(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.CHAIR)
  async assignCase(
    @Param('id', ParseUUIDPipe) caseId: string,
    @Body(ValidationPipe) assignCaseDto: AssignCaseDto,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; data: Case; message: string }> {
    this.logger.log(`Assigning case ${caseId} to caseworker ${assignCaseDto.caseworkerId} by user ${user.id}`);
    
    const case_ = await this.casesService.assignCase(caseId, assignCaseDto.caseworkerId, user);
    
    return {
      success: true,
      data: case_,
      message: 'Case assigned successfully',
    };
  }

  /**
   * Update case status
   */
  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.CHAIR, UserRole.CASEWORKER, UserRole.SUPERVISOR)
  async updateStatus(
    @Param('id', ParseUUIDPipe) caseId: string,
    @Body(ValidationPipe) updateStatusDto: UpdateCaseStatusDto,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; data: Case; message: string }> {
    this.logger.log(`Updating case ${caseId} status to ${updateStatusDto.status} by user ${user.id}`);
    
    const case_ = await this.casesService.updateStatus(caseId, updateStatusDto.status, user, updateStatusDto.comment);
    
    return {
      success: true,
      data: case_,
      message: 'Case status updated successfully',
    };
  }

  /**
   * Get case audit logs
   */
  @Get(':id/logs')
  @Roles(UserRole.ADMIN, UserRole.CHAIR, UserRole.CASEWORKER, UserRole.SUPERVISOR, UserRole.CLERK)
  async getCaseLogs(
    @Param('id', ParseUUIDPipe) caseId: string,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; data: CaseLog[] }> {
    this.logger.log(`Fetching logs for case ${caseId} by user ${user.id}`);
    
    // Verify case exists first
    await this.casesService.findOne(caseId);
    
    const logs = await this.casesService.getCaseLogs(caseId);
    
    return {
      success: true,
      data: logs,
    };
  }
}