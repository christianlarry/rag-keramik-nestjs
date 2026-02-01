import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when password is invalid or doesn't meet requirements.
 */
export class PasswordInvalidError extends DomainError {
  readonly code = AuthErrorCode.PasswordInvalid;

  constructor(message?: string) {
    super(message ?? "Password is invalid or doesn't meet requirements.");
  }
}
