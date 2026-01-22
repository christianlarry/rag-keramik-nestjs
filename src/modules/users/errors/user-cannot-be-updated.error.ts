import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when user cannot be updated due to business rules.
 */
export class UserCannotBeUpdatedError extends DomainError {
  readonly code = UserErrorCode.USER_CANNOT_BE_UPDATED;
  constructor(reason?: string) {
    super(
      reason
        ? `User cannot be updated. Reason: ${reason}`
        : "User cannot be updated."
    );
  }
}
