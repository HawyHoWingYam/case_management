import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNotEmpty, MaxLength, IsObject } from 'class-validator';
import { Priority } from '@prisma/client';

export class CreateCaseDto {
  @ApiProperty({
    description: '案件标题',
    example: '系统登录问题处理',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: '案件描述',
    example: '用户反馈无法正常登录系统，需要技术支持协助解决',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: '案件优先级',
    enum: Priority,
    example: Priority.MEDIUM,
    default: Priority.MEDIUM,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    description: '指派给用户ID',
    example: 2,
  })
  @IsOptional()
  assigned_to?: number;

  @ApiPropertyOptional({
    description: '案件元数据（包含文件附件等信息）',
    example: {
      attachments: [
        {
          filename: 'document.pdf',
          originalname: 'My Document.pdf',
          url: 'http://localhost:9000/case-files/document.pdf',
          size: 12345,
          mimetype: 'application/pdf'
        }
      ]
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class CreateCaseResponseDto {
  @ApiProperty({
    description: '案件ID',
    example: 1,
  })
  case_id: number;

  @ApiProperty({
    description: '案件标题',
    example: '系统登录问题处理',
  })
  title: string;

  @ApiProperty({
    description: '案件描述',
    example: '用户反馈无法正常登录系统，需要技术支持协助解决',
  })
  description: string;

  @ApiProperty({
    description: '案件状态',
    example: 'OPEN',
  })
  status: string;

  @ApiProperty({
    description: '案件优先级',
    example: 'MEDIUM',
  })
  priority: string;

  @ApiProperty({
    description: '创建者ID',
    example: 1,
  })
  created_by: number;

  @ApiProperty({
    description: '指派给用户ID',
    example: 2,
    nullable: true,
  })
  assigned_to: number | null;

  @ApiProperty({
    description: '创建时间',
    example: '2025-08-01T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2025-08-01T10:30:00.000Z',
  })
  updated_at: Date;
}