import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCaseDto {
  @ApiProperty({ description: 'ID of the caseworker to assign to' })
  @IsNumber()
  @IsPositive()
  assignedCaseworkerId: number;
}