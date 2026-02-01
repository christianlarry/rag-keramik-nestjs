import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when passwords do not match (e.g., password confirmation).
 */
export class PasswordMismatchError extends DomainError {
  readonly code = AuthErrorCode.PasswordMismatch;

  constructor(message?: string) {
    super(message ?? 'Password and password confirmation do not match.');
  }
}
