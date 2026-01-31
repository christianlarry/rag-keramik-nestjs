import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "../enums/user-error-code.enum";

/**
 * Error thrown when user cannot be deleted due to business rules.
 */
export class UserCannotBeDeletedError extends DomainError {
  readonly code = UserErrorCode.USER_CANNOT_BE_DELETED;
  constructor(reason?: string) {
    super(
      reason
        ? `User cannot be deleted. Reason: ${reason}`
        : "User cannot be deleted."
    );
  }
}
