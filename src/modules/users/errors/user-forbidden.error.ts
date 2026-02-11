import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when a user does not have permission to perform an action.
 */
export class UserForbiddenError extends DomainError {
  readonly code = UserErrorCode.USER_FORBIDDEN;
  constructor(message?: string) {
    super(message || "User does not have permission to perform this action.");
  }
}
