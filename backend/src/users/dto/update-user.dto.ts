import { IsOptional, IsEnum, IsString, IsEmail, MinLength, MaxLength, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
// import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
// import { CreateUserDto } from './create-user.dto';
import { UserStatus } from '../entities/user.entity';
import { UserRole } from '../../common/enums';

export class UpdateUserDto {
  // Email field
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  // First name field
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  // Last name field
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  // Phone number field
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  phoneNumber?: string;

  // Role field
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role?: UserRole;

  // Profile image URL field
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Profile image URL must not exceed 500 characters' })
  profileImageUrl?: string;

  // Password field
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password?: string;

  // Status field
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Invalid user status' })
  status?: UserStatus;

  // Email verification fields
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsString()
  emailVerificationToken?: string;

  // Password reset fields
  @IsOptional()
  @IsString()
  passwordResetToken?: string;

  @IsOptional()
  @IsDateString()
  passwordResetExpires?: Date;
}