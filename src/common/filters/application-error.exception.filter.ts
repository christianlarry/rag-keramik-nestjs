import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApplicationError } from 'src/core/application/application-error.base';
import { ProductApplicationErrorToHttpStatusMap } from 'src/modules/products/presentation/http/errors/product-application-error-to-http-status.map';

/**
 * Exception filter that catches all ApplicationError exceptions
 * and transforms them into appropriate HTTP responses with proper status codes.
 */
@Catch(ApplicationError)
export class ApplicationErrorExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApplicationErrorExceptionFilter.name);

  /**
   * Maps application error codes to HTTP status codes.
   * This ensures that application errors are translated to appropriate HTTP responses.
   */
  private readonly errorCodeToHttpStatusMap: Record<string, HttpStatus> = {
    ...ProductApplicationErrorToHttpStatusMap,
  };

  catch(exception: ApplicationError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getHttpStatus(exception.code);
    const errorResponse = this.buildErrorResponse(
      exception,
      status,
      request.url,
    );

    // Log error with appropriate level based on status code
    this.logError(exception, status, request);

    response.status(status).json(errorResponse);
  }

  /**
   * Determines the appropriate HTTP status code for an application error.
   * Returns 500 Internal Server Error for unmapped error codes.
   */
  private getHttpStatus(errorCode: string): HttpStatus {
    return (
      this.errorCodeToHttpStatusMap[errorCode] ||
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  /**
   * Builds a standardized error response object.
   */
  private buildErrorResponse(
    exception: ApplicationError,
    status: HttpStatus,
    path: string,
  ) {
    return {
      statusCode: status,
      message: exception.message,
      error: this.getErrorName(status),
      code: exception.code,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  /**
   * Gets the human-readable error name from HTTP status code.
   */
  private getErrorName(status: HttpStatus): string {
    const errorNames: Partial<Record<HttpStatus, string>> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error'
    };

    return errorNames[status] || 'Error';
  }

  /**
   * Logs the error with appropriate level based on HTTP status.
   * - 4xx errors: warning (client errors)
   * - 5xx errors: error (server errors)
   */
  private logError(
    exception: ApplicationError,
    status: HttpStatus,
    request: Request,
  ): void {
    const logMessage = `Application Error: ${exception.code} - ${exception.message}`;
    const logContext = {
      errorCode: exception.code,
      statusCode: status,
      path: request.url,
      method: request.method,
      userAgent: request.get('user-agent'),
      ip: request.ip,
    };

    // Use error level for 5xx, warn for 4xx
    if (status >= 500) {
      this.logger.error(logMessage, exception.stack, logContext);
    } else {
      this.logger.warn(logMessage, logContext);
    }
  }
}
