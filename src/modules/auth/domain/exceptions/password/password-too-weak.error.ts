import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when password is too weak and doesn't meet security requirements.
 */
export class PasswordTooWeakError extends DomainError {
  readonly code = AuthErrorCode.PasswordTooWeak;

  constructor(message?: string) {
    super(
      message ??
      'Password is too weak. Please use a stronger password with a mix of uppercase, lowercase, numbers, and special characters.',
    );
  }
}
