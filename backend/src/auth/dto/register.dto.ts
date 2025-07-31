import { CreateUserDto } from '../../users/dto/create-user.dto';
// import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto extends CreateUserDto {
  // // @ApiProperty({ 
  //   description: 'Confirm password (must match password)',
  //   example: 'SecurePassword123',
  //   minLength: 8 
  // })
  // Note: In a real implementation, you might want to add password confirmation validation
  // This would require a custom validator or validation in the service layer
}