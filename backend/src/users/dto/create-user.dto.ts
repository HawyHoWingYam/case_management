import { IsEmail, IsString, IsOptional, MinLength, MaxLength, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums';

export class CreateUserDto {
  // // @ApiProperty({ 
  //   description: 'User email address',
  //   example: 'john.doe@example.com' 
  // })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  // // @ApiProperty({ 
  //   description: 'User password (minimum 8 characters)',
  //   example: 'SecurePassword123',
  //   minLength: 8 
  // })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password: string;

  // // @ApiProperty({ 
  //   description: 'User first name',
  //   example: 'John',
  //   maxLength: 100 
  // })
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  @Transform(({ value }) => value.trim())
  firstName: string;

  // // @ApiProperty({ 
  //   description: 'User last name',
  //   example: 'Doe',
  //   maxLength: 100 
  // })
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  @Transform(({ value }) => value.trim())
  lastName: string;

  // // // @ApiPropertyOptional({ 
  //   description: 'User phone number',
  //   example: '+1234567890' 
  // })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  phoneNumber?: string;

  // // // @ApiPropertyOptional({ 
  //   enum: UserRole,
  //   description: 'User role in the system',
  //   default: UserRole.CLIENT 
  // })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role?: UserRole = UserRole.CLIENT;

  // // // @ApiPropertyOptional({ 
  //   description: 'User profile image URL',
  //   example: 'https://example.com/avatar.jpg' 
  // })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Profile image URL must not exceed 500 characters' })
  profileImageUrl?: string;

  // Email verification token (internal use)
  @IsOptional()
  @IsString()
  emailVerificationToken?: string;
}