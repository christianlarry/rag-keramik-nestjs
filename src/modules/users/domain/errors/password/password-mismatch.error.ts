import { DomainError } from "src/common/errors/domain.error";
import { PasswordErrorCode } from "../enums/password-error-code.enum";

/**
 * Error thrown when passwords do not match (e.g., password confirmation).
 */
export class PasswordMismatchError extends DomainError {
  readonly code = PasswordErrorCode.PASSWORD_MISMATCH;
  constructor() {
    super("Password and password confirmation do not match.");
  }
}
