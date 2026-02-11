import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when attempting to perform an operation on a deleted user.
 */
export class UserDeletedError extends DomainError {
  readonly code = UserErrorCode.USER_DELETED;
  constructor(userId?: string) {
    super(
      userId
        ? `User with ID '${userId}' has been deleted.`
        : "User has been deleted."
    );
  }
}
