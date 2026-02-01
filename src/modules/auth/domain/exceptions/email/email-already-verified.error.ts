import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when email has already been verified.
 */
export class EmailAlreadyVerifiedError extends DomainError {
  readonly code = AuthErrorCode.EmailAlreadyVerified;

  constructor(message?: string) {
    super(message ?? 'Email has already been verified.');
  }
}
