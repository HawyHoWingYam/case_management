import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(1, { message: 'Token is required' })
  token: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password: string;
}