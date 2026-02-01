import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when an invalid authentication provider is specified.
 */
export class InvalidProviderError extends DomainError {
  readonly code = AuthErrorCode.InvalidProvider;

  constructor(provider?: string) {
    super(
      provider
        ? `Invalid authentication provider: ${provider}. Must be one of: LOCAL, GOOGLE, FACEBOOK.`
        : 'Invalid authentication provider specified.',
    );
  }
}
