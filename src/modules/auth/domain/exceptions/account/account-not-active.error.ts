import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when account is not in active state for authentication.
 */
export class AccountNotActiveError extends DomainError {
  readonly code = AuthErrorCode.AccountNotActive;

  constructor(status?: string) {
    super(
      status
        ? `Account is ${status.toLowerCase()}. Cannot proceed with authentication.`
        : 'Account is not active. Cannot proceed with authentication.',
    );
  }
}
