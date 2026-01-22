import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when attempting to link an OAuth account that is already linked.
 */
export class UserOAuthAlreadyLinkedError extends DomainError {
  readonly code = UserErrorCode.USER_OAUTH_ALREADY_LINKED;
  constructor(provider?: string) {
    super(
      provider
        ? `${provider} account is already linked to this user.`
        : "OAuth account is already linked to this user."
    );
  }
}
