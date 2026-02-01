import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when password is required but not provided.
 */
export class PasswordMissingError extends DomainError {
  readonly code = AuthErrorCode.PasswordMissing;

  constructor(message?: string) {
    super(message ?? 'Password is required for this operation.');
  }
}
