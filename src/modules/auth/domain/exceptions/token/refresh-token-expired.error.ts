import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when refresh token has expired.
 */
export class RefreshTokenExpiredError extends DomainError {
  readonly code = AuthErrorCode.RefreshTokenExpired;

  constructor(message?: string) {
    super(message ?? 'Refresh token has expired. Please log in again.');
  }
}
