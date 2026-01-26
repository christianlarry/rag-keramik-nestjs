import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when password is too weak and doesn't meet security requirements.
 */
export class UserPasswordTooWeakError extends DomainError {
  readonly code = UserErrorCode.USER_PASSWORD_TOO_WEAK;
  constructor(message?: string) {
    super(
      message ||
      "Password is too weak. Please use a stronger password with a mix of uppercase, lowercase, numbers, and special characters."
    );
  }
}
