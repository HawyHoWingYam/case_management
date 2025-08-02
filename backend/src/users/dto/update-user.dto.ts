import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { Role } from '@prisma/client';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: '用户名',
    example: 'john_doe_updated',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度至少为3个字符' })
  username?: string;

  @ApiProperty({
    description: '邮箱地址',
    example: 'john.updated@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({
    description: '新密码',
    example: 'newpassword123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度至少为6个字符' })
  password?: string;

  @ApiProperty({
    description: '用户角色',
    enum: Role,
    example: 'MANAGER',
    required: false,
  })
  @IsOptional()
  @IsEnum(Role, { message: '角色值无效' })
  role?: Role;

  @ApiProperty({
    description: '是否激活',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '激活状态必须是布尔值' })
  is_active?: boolean;
}