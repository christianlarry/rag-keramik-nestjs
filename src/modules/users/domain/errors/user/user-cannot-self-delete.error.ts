import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "../enums/user-error-code.enum";

/**
 * Error thrown when user attempts to delete their own account but it's not allowed.
 */
export class UserCannotSelfDeleteError extends DomainError {
  readonly code = UserErrorCode.USER_CANNOT_SELF_DELETE;
  constructor(reason?: string) {
    super(
      reason
        ? `You cannot delete your own account. Reason: ${reason}`
        : "You cannot delete your own account."
    );
  }
}
