import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when refresh token is invalid.
 */
export class RefreshTokenInvalidError extends DomainError {
  readonly code = AuthErrorCode.RefreshTokenInvalid;

  constructor(message?: string) {
    super(message ?? 'Refresh token is invalid.');
  }
}
