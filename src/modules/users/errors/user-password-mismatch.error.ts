import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when passwords do not match (e.g., password confirmation).
 */
export class UserPasswordMismatchError extends DomainError {
  readonly code = UserErrorCode.USER_PASSWORD_MISMATCH;
  constructor() {
    super("Password and password confirmation do not match.");
  }
}
