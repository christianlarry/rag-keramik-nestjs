import { DomainError } from "src/common/errors/domain.error";
import { PasswordErrorCode } from "../enums/password-error-code.enum";

/**
 * Error thrown when user's password has expired and needs to be changed.
 */
export class PasswordExpiredError extends DomainError {
  readonly code = PasswordErrorCode.PASSWORD_EXPIRED;
  constructor() {
    super("Password has expired. Please change your password.");
  }
}
