import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when attempting to activate a suspended account.
 */
export class SuspendedAccountActivationError extends DomainError {
  readonly code = AuthErrorCode.SuspendedAccountActivation;

  constructor(message?: string) {
    super(
      message || 'Suspended account cannot be activated. Please contact support for assistance.',
    );
  }
}
