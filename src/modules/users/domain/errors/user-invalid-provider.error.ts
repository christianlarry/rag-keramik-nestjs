import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class UserInvalidProviderError extends DomainError {
  readonly code = UserErrorCode.USER_INVALID_PROVIDER

  constructor(message?: string) {
    super(message || `Invalid provider`);
  }
}