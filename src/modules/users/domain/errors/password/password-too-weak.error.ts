import { DomainError } from "src/common/errors/domain.error";
import { PasswordErrorCode } from "../enums/password-error-code.enum";

/**
 * Error thrown when password is too weak and doesn't meet security requirements.
 */
export class PasswordTooWeakError extends DomainError {
  readonly code = PasswordErrorCode.PASSWORD_TOO_WEAK;
  constructor(message?: string) {
    super(
      message ||
      "Password is too weak. Please use a stronger password with a mix of uppercase, lowercase, numbers, and special characters."
    );
  }
}
