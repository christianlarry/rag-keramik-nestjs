import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when a user is not authenticated.
 */
export class UserUnauthorizedError extends DomainError {
  readonly code = UserErrorCode.USER_UNAUTHORIZED;
  constructor(message?: string) {
    super(message || "User is not authenticated.");
  }
}
