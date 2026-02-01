import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when user's password has expired and needs to be changed.
 */
export class PasswordExpiredError extends DomainError {
  readonly code = AuthErrorCode.PasswordExpired;

  constructor(message?: string) {
    super(message ?? 'Password has expired. Please change your password.');
  }
}
