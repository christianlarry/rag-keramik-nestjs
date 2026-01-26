import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when password is invalid or doesn't meet requirements.
 */
export class UserPasswordInvalidError extends DomainError {
  readonly code = UserErrorCode.USER_PASSWORD_INVALID;
  constructor(message?: string) {
    super(message || "Password is invalid or doesn't meet requirements.");
  }
}
