import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when an authentication token is invalid.
 */
export class TokenInvalidError extends DomainError {
  readonly code = AuthErrorCode.TokenInvalid;

  constructor(tokenType?: string) {
    super(tokenType ? `${tokenType} token is invalid.` : 'Token is invalid.');
  }
}
