import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Role } from '@prisma/client';

export class UserQueryDto {
  @ApiProperty({
    description: '页码',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码必须大于0' })
  page?: number = 1;

  @ApiProperty({
    description: '每页数量',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Min(1, { message: '每页数量必须大于0' })
  @Max(100, { message: '每页数量不能超过100' })
  limit?: number = 10;

  @ApiProperty({
    description: '按角色筛选',
    enum: Role,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role, { message: '角色值无效' })
  role?: Role;

  @ApiProperty({
    description: '按激活状态筛选',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: '激活状态必须是布尔值' })
  is_active?: boolean;

  @ApiProperty({
    description: '搜索关键词（用户名或邮箱）',
    example: 'john',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;

  @ApiProperty({
    description: '排序字段',
    example: 'created_at',
    enum: ['username', 'email', 'role', 'created_at', 'updated_at', 'last_login'],
    default: 'created_at',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '排序字段必须是字符串' })
  sort_by?: string = 'created_at';

  @ApiProperty({
    description: '排序方向',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: '排序方向必须是 asc 或 desc' })
  sort_order?: 'asc' | 'desc' = 'desc';
}