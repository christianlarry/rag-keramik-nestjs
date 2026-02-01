import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when email verification token has expired.
 */
export class EmailVerificationTokenExpiredError extends DomainError {
  readonly code = AuthErrorCode.EmailVerificationTokenExpired;

  constructor(message?: string) {
    super(message ?? 'Email verification token has expired. Please request a new one.');
  }
}
