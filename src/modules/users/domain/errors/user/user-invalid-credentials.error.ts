import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "../enums/user-error-code.enum";

/**
 * Error thrown when user credentials are invalid.
 */
export class UserInvalidCredentialsError extends DomainError {
  readonly code = UserErrorCode.USER_INVALID_CREDENTIALS;
  constructor(message?: string) {
    super(message || "Invalid credentials provided.");
  }
}
