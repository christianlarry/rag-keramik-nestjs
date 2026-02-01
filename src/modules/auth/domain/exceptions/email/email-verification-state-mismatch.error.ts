import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when email verification state doesn't match the verifiedAt timestamp.
 */
export class EmailVerificationStateMismatchError extends DomainError {
  readonly code = AuthErrorCode.EmailVerificationStateMismatch;

  constructor(message?: string) {
    super(
      message ?? 'Email verification state does not match the verification timestamp.',
    );
  }
}
