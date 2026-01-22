import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DomainError } from '../errors/domain.error';
import { Request, Response } from 'express';

/**
 * Exception filter that catches all DomainError exceptions
 * and transforms them into appropriate HTTP responses with proper status codes.
 */
@Catch(DomainError)
export class DomainErrorExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorExceptionFilter.name);

  /**
   * Maps domain error codes to HTTP status codes.
   * This ensures that domain errors are translated to appropriate HTTP responses.
   */
  private readonly errorCodeToHttpStatusMap: Record<string, HttpStatus> = {
    // 404 Not Found
    USER_NOT_FOUND: HttpStatus.NOT_FOUND,

    // 409 Conflict - Resource already exists
    USER_EMAIL_ALREADY_EXISTS: HttpStatus.CONFLICT,
    USER_USERNAME_ALREADY_EXISTS: HttpStatus.CONFLICT,
    USER_EMAIL_ALREADY_VERIFIED: HttpStatus.CONFLICT,
    USER_OAUTH_ALREADY_LINKED: HttpStatus.CONFLICT,

    // 403 Forbidden - State/Status issues
    USER_INACTIVE: HttpStatus.FORBIDDEN,
    USER_SUSPENDED: HttpStatus.FORBIDDEN,
    USER_DELETED: HttpStatus.FORBIDDEN,
    USER_BANNED: HttpStatus.FORBIDDEN,

    // 401 Unauthorized - Authentication issues
    USER_UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
    USER_INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
    USER_TOKEN_INVALID: HttpStatus.UNAUTHORIZED,
    USER_TOKEN_EXPIRED: HttpStatus.UNAUTHORIZED,
    USER_SESSION_EXPIRED: HttpStatus.UNAUTHORIZED,

    // 403 Forbidden - Authorization/Permission issues
    USER_FORBIDDEN: HttpStatus.FORBIDDEN,
    USER_INSUFFICIENT_PERMISSIONS: HttpStatus.FORBIDDEN,
    USER_CANNOT_CHANGE_OWN_ROLE: HttpStatus.FORBIDDEN,

    // 400 Bad Request - Validation/Business rule violations
    USER_PASSWORD_INVALID: HttpStatus.BAD_REQUEST,
    USER_PASSWORD_MISMATCH: HttpStatus.BAD_REQUEST,
    USER_PASSWORD_EXPIRED: HttpStatus.BAD_REQUEST,
    USER_PASSWORD_TOO_WEAK: HttpStatus.BAD_REQUEST,
    USER_EMAIL_INVALID: HttpStatus.BAD_REQUEST,
    USER_EMAIL_NOT_VERIFIED: HttpStatus.BAD_REQUEST,
    USER_PROFILE_INCOMPLETE: HttpStatus.BAD_REQUEST,

    // 422 Unprocessable Entity - Operation constraints
    USER_CANNOT_BE_UPDATED: HttpStatus.UNPROCESSABLE_ENTITY,
    USER_CANNOT_BE_DELETED: HttpStatus.UNPROCESSABLE_ENTITY,
    USER_CANNOT_SELF_DELETE: HttpStatus.UNPROCESSABLE_ENTITY,

    // 500 Internal Server Error - Upload/External service failures
    USER_AVATAR_UPLOAD_FAILED: HttpStatus.INTERNAL_SERVER_ERROR,
    USER_OAUTH_LINK_FAILED: HttpStatus.INTERNAL_SERVER_ERROR,

    // 404 Not Found - Provider not linked
    USER_PROVIDER_NOT_LINKED: HttpStatus.NOT_FOUND,
  };

  catch(exception: DomainError, host: ArgumentsHost): void {
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
   * Determines the appropriate HTTP status code for a domain error.
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
    exception: DomainError,
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
    exception: DomainError,
    status: HttpStatus,
    request: Request,
  ): void {
    const logMessage = `Domain Error: ${exception.code} - ${exception.message}`;
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