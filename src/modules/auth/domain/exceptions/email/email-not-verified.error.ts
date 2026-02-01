import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when email has not been verified.
 */
export class EmailNotVerifiedError extends DomainError {
  readonly code = AuthErrorCode.EmailNotVerified;

  constructor(message?: string) {
    super(message ?? 'Email address has not been verified. Please verify your email first.');
  }
}
