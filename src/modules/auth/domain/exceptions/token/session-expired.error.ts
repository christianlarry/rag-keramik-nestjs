import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when user session has expired.
 */
export class SessionExpiredError extends DomainError {
  readonly code = AuthErrorCode.SessionExpired;

  constructor(message?: string) {
    super(message ?? 'Session has expired. Please log in again.');
  }
}
