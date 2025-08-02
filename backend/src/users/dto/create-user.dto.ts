import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度至少为3个字符' })
  username: string;

  @ApiProperty({
    description: '邮箱地址',
    example: 'john@example.com',
    format: 'email',
  })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度至少为6个字符' })
  password: string;

  @ApiProperty({
    description: '用户角色',
    enum: Role,
    example: 'USER',
    default: 'USER',
  })
  @IsOptional()
  @IsEnum(Role, { message: '角色值无效' })
  role?: Role = Role.USER;

  @ApiProperty({
    description: '是否激活',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: '激活状态必须是布尔值' })
  is_active?: boolean = true;
}