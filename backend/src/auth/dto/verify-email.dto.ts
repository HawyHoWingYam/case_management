import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @MinLength(1, { message: 'Token is required' })
  token: string;
}