import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when OAuth account linking fails.
 */
export class UserOAuthLinkFailedError extends DomainError {
  readonly code = UserErrorCode.USER_OAUTH_LINK_FAILED;
  constructor(provider?: string, reason?: string) {
    const baseMessage = provider
      ? `Failed to link ${provider} account.`
      : "Failed to link OAuth account.";
    const fullMessage = reason ? `${baseMessage} Reason: ${reason}` : baseMessage;
    super(fullMessage);
  }
}
