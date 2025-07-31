import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | object;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      
      if (typeof errorResponse === 'string') {
        message = errorResponse;
        error = exception.message;
      } else {
        message = (errorResponse as any).message || exception.message;
        error = (errorResponse as any).error || exception.message;
      }
    } else if (exception instanceof QueryFailedError) {
      // Handle database errors
      status = HttpStatus.BAD_REQUEST;
      error = 'Database Error';
      
      // Handle specific database constraint violations
      if (exception.message.includes('duplicate key')) {
        message = 'Resource already exists';
      } else if (exception.message.includes('foreign key')) {
        message = 'Referenced resource does not exist';
      } else if (exception.message.includes('not-null')) {
        message = 'Required field is missing';
      } else {
        message = 'Database operation failed';
      }
    } else {
      // Handle unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'Internal Server Error';
      message = 'An unexpected error occurred';
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
    };

    // Log error details
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception,
    );

    // In development, include stack trace
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      (errorResponse as any).stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}