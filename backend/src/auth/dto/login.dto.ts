import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '用户邮箱',
    example: 'admin@example.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({
    description: '用户密码',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度至少为6位' })
  password: string;
}

export class UserInfoDto {
  @ApiProperty({
    description: '用户ID',
    example: 1,
  })
  user_id: number;

  @ApiProperty({
    description: '用户名',
    example: 'admin',
  })
  username: string;

  @ApiProperty({
    description: '用户邮箱',
    example: 'admin@example.com',
  })
  email: string;

  @ApiProperty({
    description: '用户角色',
    example: 'ADMIN',
    enum: ['ADMIN', 'MANAGER', 'USER'],
  })
  role: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: '用户信息',
    type: UserInfoDto,
  })
  user: UserInfoDto;
}