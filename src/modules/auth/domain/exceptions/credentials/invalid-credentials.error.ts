import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when user credentials are invalid during authentication.
 */
export class InvalidCredentialsError extends DomainError {
  readonly code = AuthErrorCode.InvalidCredentials;

  constructor(message?: string) {
    super(message ?? 'Invalid email or password.');
  }
}
