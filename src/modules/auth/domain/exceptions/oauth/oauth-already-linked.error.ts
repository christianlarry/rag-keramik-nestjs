import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when attempting to link an OAuth account that is already linked.
 */
export class OAuthAlreadyLinkedError extends DomainError {
  readonly code = AuthErrorCode.OAuthAlreadyLinked;

  constructor(provider?: string) {
    super(
      provider
        ? `${provider} account is already linked.`
        : 'OAuth account is already linked.',
    );
  }
}
