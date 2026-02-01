import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when account is locked due to security reasons.
 */
export class AccountLockedError extends DomainError {
  readonly code = AuthErrorCode.AccountLocked;

  constructor(message?: string) {
    super(
      message ?? 'Account is locked. Please contact support or wait before trying again.',
    );
  }
}
