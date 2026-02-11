import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when user's password has expired and needs to be changed.
 */
export class UserPasswordExpiredError extends DomainError {
  readonly code = UserErrorCode.USER_PASSWORD_EXPIRED;
  constructor() {
    super("Password has expired. Please change your password.");
  }
}
