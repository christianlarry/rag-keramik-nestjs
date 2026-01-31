import { DomainError } from "src/common/errors/domain.error";
import { PasswordErrorCode } from "../enums/password-error-code.enum";

/**
 * Error thrown when password is invalid or doesn't meet requirements.
 */
export class PasswordInvalidError extends DomainError {
  readonly code = PasswordErrorCode.PASSWORD_INVALID;
  constructor(message?: string) {
    super(message || "Password is invalid or doesn't meet requirements.");
  }
}
