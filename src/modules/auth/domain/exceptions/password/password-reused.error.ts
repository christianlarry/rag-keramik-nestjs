import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when user attempts to reuse a previous password.
 */
export class PasswordReusedError extends DomainError {
  readonly code = AuthErrorCode.PasswordReused;

  constructor(message?: string) {
    super(
      message ?? 'Cannot reuse a previous password. Please choose a different password.',
    );
  }
}
