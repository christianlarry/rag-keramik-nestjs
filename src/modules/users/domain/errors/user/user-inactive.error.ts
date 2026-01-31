import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "../enums/user-error-code.enum";

/**
 * Error thrown when attempting to perform an operation on an inactive user.
 */
export class UserInactiveError extends DomainError {
  readonly code = UserErrorCode.USER_INACTIVE;
  constructor(userId?: string) {
    super(
      userId
        ? `User with ID '${userId}' is inactive.`
        : "User is inactive."
    );
  }
}
