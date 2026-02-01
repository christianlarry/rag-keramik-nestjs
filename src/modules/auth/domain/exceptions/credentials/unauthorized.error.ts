import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when a user is not authenticated.
 */
export class UnauthorizedError extends DomainError {
  readonly code = AuthErrorCode.Unauthorized;

  constructor(message?: string) {
    super(message ?? 'Authentication required. Please log in.');
  }
}
