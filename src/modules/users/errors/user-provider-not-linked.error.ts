import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when attempting to access an OAuth provider that is not linked.
 */
export class UserProviderNotLinkedError extends DomainError {
  readonly code = UserErrorCode.USER_PROVIDER_NOT_LINKED;
  constructor(provider?: string) {
    super(
      provider
        ? `${provider} account is not linked to this user.`
        : "OAuth provider is not linked to this user."
    );
  }
}
