import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when an OAuth provider is not linked to the account.
 */
export class ProviderNotLinkedError extends DomainError {
  readonly code = AuthErrorCode.ProviderNotLinked;

  constructor(provider?: string) {
    super(
      provider
        ? `${provider} account is not linked.`
        : 'OAuth provider is not linked to this account.',
    );
  }
}
