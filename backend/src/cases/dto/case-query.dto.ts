// backend/src/cases/dto/case-query.dto.ts
import { IsOptional, IsEnum, IsString, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CaseStatus, Priority } from '@prisma/client';

export class CaseQueryDto {
  @ApiProperty({
    description: '视图类型',
    enum: ['all', 'my_cases', 'assigned', 'created', 'team', 'urgent', 'pending', 'in_progress', 'resolved'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['all', 'my_cases', 'assigned', 'created', 'team', 'urgent', 'pending', 'in_progress', 'resolved'])
  view?: string;

  @ApiProperty({
    description: '案件状态筛选',
    enum: CaseStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @ApiProperty({
    description: '优先级筛选',
    enum: Priority,
    required: false,
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({
    description: '指派给的用户ID',
    type: 'number',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  assignedTo?: number;

  @ApiProperty({
    description: '创建者用户ID',
    type: 'number',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  createdBy?: number;

  @ApiProperty({
    description: '搜索关键词（搜索标题和描述）',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: '页码（从1开始）',
    type: 'number',
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '每页数量（默认20，最大100）',
    type: 'number',
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: '排序字段',
    enum: ['created_at', 'updated_at', 'title', 'priority', 'status'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['created_at', 'updated_at', 'title', 'priority', 'status'])
  sortBy?: string = 'created_at';

  @ApiProperty({
    description: '排序方向',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({
    description: '创建时间范围-开始',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdAfter?: string;

  @ApiProperty({
    description: '创建时间范围-结束',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdBefore?: string;

  @ApiProperty({
    description: '更新时间范围-开始',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsString()
  updatedAfter?: string;

  @ApiProperty({
    description: '更新时间范围-结束',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsString()
  updatedBefore?: string;

  @ApiProperty({
    description: '包含的关联数据',
    type: [String],
    enum: ['creator', 'assignee', 'logs', 'attachments'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(v => v.trim());
    }
    return value;
  })
  include?: string[];

  // 内部使用的字段，不暴露在API文档中
  userId?: number;
  role?: string;
}

// 统计查询DTO
export class CaseStatsQueryDto {
  @ApiProperty({
    description: '统计周期',
    enum: ['day', 'week', 'month', 'quarter', 'year'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'])
  period?: string = 'month';

  @ApiProperty({
    description: '是否包含图表数据',
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  includeCharts?: boolean = false;

  @ApiProperty({
    description: '是否包含趋势数据',
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  includeTrends?: boolean = true;

  // 内部使用的字段
  userId?: number;
  role?: string;
}

// 仪表板查询DTO
export class DashboardQueryDto {
  @ApiProperty({
    description: '仪表板视图类型',
    enum: ['overview', 'my_cases', 'assigned', 'created', 'team', 'all', 'urgent', 'pending', 'in_progress', 'resolved'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['overview', 'my_cases', 'assigned', 'created', 'team', 'all', 'urgent', 'pending', 'in_progress', 'resolved'])
  view?: string = 'overview';

  @ApiProperty({
    description: '是否包含统计数据',
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  includeStats?: boolean = true;

  @ApiProperty({
    description: '是否包含最近活动',
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  includeActivity?: boolean = true;

  @ApiProperty({
    description: '是否包含最近案件',
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  includeRecentCases?: boolean = true;

  @ApiProperty({
    description: '活动记录数量限制',
    type: 'number',
    required: false,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  activityLimit?: number = 10;

  @ApiProperty({
    description: '案件数量限制',
    type: 'number',
    required: false,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  casesLimit?: number = 10;

  @ApiProperty({
    description: '统计周期',
    enum: ['day', 'week', 'month', 'quarter', 'year'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'])
  period?: string = 'month';

  // 内部使用的字段
  userId?: number;
  role?: string;
}