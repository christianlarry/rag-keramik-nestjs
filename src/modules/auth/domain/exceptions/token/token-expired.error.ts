import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when an authentication token has expired.
 */
export class TokenExpiredError extends DomainError {
  readonly code = AuthErrorCode.TokenExpired;

  constructor(tokenType?: string) {
    super(tokenType ? `${tokenType} token has expired.` : 'Token has expired.');
  }
}
