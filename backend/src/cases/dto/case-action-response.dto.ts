import { ApiProperty } from '@nestjs/swagger';

export class CaseActionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  caseId?: number;

  @ApiProperty({ required: false })
  newStatus?: string;
}