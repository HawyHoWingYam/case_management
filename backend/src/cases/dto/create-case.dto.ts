import { IsString, IsEnum, IsOptional, IsDateString, Length } from 'class-validator';
import { CasePriority, CaseType } from '../../common/enums';

export class CreateCaseDto {
  @IsString()
  @Length(1, 255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CaseType)
  type?: CaseType;

  @IsOptional()
  @IsEnum(CasePriority)
  priority?: CasePriority;

  @IsOptional()
  @IsDateString()
  due_date?: Date;

  @IsOptional()
  @IsString()
  clientId?: string;
}