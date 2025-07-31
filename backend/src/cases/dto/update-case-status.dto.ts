import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CaseStatus } from '../../common/enums';

export class UpdateCaseStatusDto {
  @IsEnum(CaseStatus, { message: 'Invalid case status' })
  status: CaseStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Comment must not exceed 1000 characters' })
  comment?: string;
}