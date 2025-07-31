import { IsUUID } from 'class-validator';

export class AssignCaseDto {
  @IsUUID(4, { message: 'Invalid caseworker ID format' })
  caseworkerId: string;
}