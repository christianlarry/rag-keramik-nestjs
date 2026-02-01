import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when an invalid account status is provided.
 */
export class InvalidStatusError extends DomainError {
  readonly code = AuthErrorCode.InvalidStatus;

  constructor(status?: string) {
    super(
      status
        ? `Invalid account status: ${status}. Must be one of: ACTIVE, INACTIVE, SUSPENDED, DELETED.`
        : 'Invalid account status specified.',
    );
  }
}
