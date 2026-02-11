import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when user session has expired.
 */
export class UserSessionExpiredError extends DomainError {
  readonly code = UserErrorCode.USER_SESSION_EXPIRED;
  constructor() {
    super("Session has expired. Please log in again.");
  }
}
