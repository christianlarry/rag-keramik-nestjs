import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when too many failed login attempts have been made.
 */
export class TooManyLoginAttemptsError extends DomainError {
  readonly code = AuthErrorCode.TooManyLoginAttempts;

  constructor(retryAfterMinutes?: number) {
    super(
      retryAfterMinutes
        ? `Too many failed login attempts. Please try again after ${retryAfterMinutes} minutes.`
        : 'Too many failed login attempts. Please try again later.',
    );
  }
}
