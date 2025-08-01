/**
 * Common DTOs and interfaces
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: PaginationDto;
}

export class ErrorResponseDto {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  error: string;
  message: string;
  stack?: string; // Only in development
}