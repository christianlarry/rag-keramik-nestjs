import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when attempting to activate an account with unverified email.
 */
export class UnverifiedEmailActivationError extends DomainError {
  readonly code = AuthErrorCode.UnverifiedEmailActivation;

  constructor(message?: string) {
    super(
      message || 'Cannot activate account with unverified email. Please verify your email first.',
    );
  }
}
