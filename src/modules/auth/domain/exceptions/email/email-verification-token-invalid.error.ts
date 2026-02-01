import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when email verification token is invalid.
 */
export class EmailVerificationTokenInvalidError extends DomainError {
  readonly code = AuthErrorCode.EmailVerificationTokenInvalid;

  constructor(message?: string) {
    super(message ?? 'Email verification token is invalid.');
  }
}
