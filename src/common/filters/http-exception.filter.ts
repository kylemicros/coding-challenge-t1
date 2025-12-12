import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    interface ErrorResponse {
      message?: string | string[];
      error?: string;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as ErrorResponse).message || exception.message,
      error:
        typeof exceptionResponse === 'object' &&
        (exceptionResponse as ErrorResponse).error
          ? (exceptionResponse as ErrorResponse).error
          : HttpStatus[status],
    };

    response.status(status).json(errorResponse);
  }
}
