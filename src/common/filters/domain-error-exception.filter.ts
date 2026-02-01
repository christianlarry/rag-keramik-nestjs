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
    // ============================================
    // AUTH DOMAIN ERRORS
    // ============================================

    // 401 Unauthorized - Authentication issues
    AUTH_INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
    AUTH_UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
    AUTH_TOKEN_INVALID: HttpStatus.UNAUTHORIZED,
    AUTH_TOKEN_EXPIRED: HttpStatus.UNAUTHORIZED,
    AUTH_SESSION_EXPIRED: HttpStatus.UNAUTHORIZED,
    AUTH_REFRESH_TOKEN_INVALID: HttpStatus.UNAUTHORIZED,
    AUTH_REFRESH_TOKEN_EXPIRED: HttpStatus.UNAUTHORIZED,

    // 400 Bad Request - Password & Email issues
    AUTH_PASSWORD_INVALID: HttpStatus.BAD_REQUEST,
    AUTH_PASSWORD_MISMATCH: HttpStatus.BAD_REQUEST,
    AUTH_PASSWORD_EXPIRED: HttpStatus.BAD_REQUEST,
    AUTH_PASSWORD_TOO_WEAK: HttpStatus.BAD_REQUEST,
    AUTH_PASSWORD_REUSED: HttpStatus.BAD_REQUEST,
    AUTH_PASSWORD_MISSING: HttpStatus.BAD_REQUEST,
    AUTH_EMAIL_NOT_VERIFIED: HttpStatus.FORBIDDEN,
    AUTH_EMAIL_VERIFICATION_STATE_MISMATCH: HttpStatus.BAD_REQUEST,
    AUTH_EMAIL_VERIFICATION_TOKEN_INVALID: HttpStatus.BAD_REQUEST,
    AUTH_EMAIL_VERIFICATION_TOKEN_EXPIRED: HttpStatus.BAD_REQUEST,
    AUTH_EMAIL_FORMAT_INVALID: HttpStatus.BAD_REQUEST,

    // 400 Bad Request - Role & Status Validation
    AUTH_INVALID_ROLE: HttpStatus.BAD_REQUEST,
    AUTH_INVALID_STATUS: HttpStatus.BAD_REQUEST,

    // 409 Conflict - Already exists
    AUTH_EMAIL_ALREADY_VERIFIED: HttpStatus.CONFLICT,
    AUTH_OAUTH_ALREADY_LINKED: HttpStatus.CONFLICT,

    // 400 Bad Request - OAuth & Provider
    AUTH_INVALID_PROVIDER: HttpStatus.BAD_REQUEST,

    // 404 Not Found - Provider not linked
    AUTH_PROVIDER_NOT_LINKED: HttpStatus.NOT_FOUND,

    // 500 Internal Server Error - OAuth failures
    AUTH_OAUTH_LINK_FAILED: HttpStatus.INTERNAL_SERVER_ERROR,

    // 403 Forbidden - Account status
    AUTH_ACCOUNT_LOCKED: HttpStatus.FORBIDDEN,
    AUTH_ACCOUNT_NOT_ACTIVE: HttpStatus.FORBIDDEN,

    // 429 Too Many Requests
    AUTH_TOO_MANY_LOGIN_ATTEMPTS: HttpStatus.TOO_MANY_REQUESTS,
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
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
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