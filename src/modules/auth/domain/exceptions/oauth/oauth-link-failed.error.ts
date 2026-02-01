import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when OAuth account linking fails.
 */
export class OAuthLinkFailedError extends DomainError {
  readonly code = AuthErrorCode.OAuthLinkFailed;

  constructor(provider?: string, reason?: string) {
    const baseMessage = provider
      ? `Failed to link ${provider} account.`
      : 'Failed to link OAuth account.';
    const fullMessage = reason ? `${baseMessage} Reason: ${reason}` : baseMessage;
    super(fullMessage);
  }
}
