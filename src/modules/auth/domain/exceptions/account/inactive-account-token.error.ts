import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when attempting to add refresh token to inactive or suspended account.
 */
export class InactiveAccountTokenError extends DomainError {
  readonly code = AuthErrorCode.InactiveAccountToken;

  constructor(message?: string) {
    super(
      message || 'Cannot add refresh token to inactive or suspended account. Account must be active.',
    );
  }
}
