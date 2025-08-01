import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { Priority, CaseStatus } from '@prisma/client';

export class UpdateCaseDto {
  @ApiPropertyOptional({
    description: '案件标题',
    example: '系统登录问题处理 - 已更新',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: '案件描述',
    example: '用户反馈无法正常登录系统，需要技术支持协助解决。已联系技术团队。',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: '案件状态',
    enum: CaseStatus,
    example: CaseStatus.IN_PROGRESS,
  })
  @IsEnum(CaseStatus)
  @IsOptional()
  status?: CaseStatus;

  @ApiPropertyOptional({
    description: '案件优先级',
    enum: Priority,
    example: Priority.HIGH,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    description: '指派给用户ID',
    example: 3,
  })
  @IsOptional()
  assigned_to?: number;
}