import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "../enums/user-error-code.enum";

/**
 * Error thrown when attempting to perform an operation on a suspended user.
 */
export class UserSuspendedError extends DomainError {
  readonly code = UserErrorCode.USER_SUSPENDED;
  constructor(userId?: string, reason?: string) {
    const baseMessage = userId
      ? `User with ID '${userId}' is suspended.`
      : "User is suspended.";
    const fullMessage = reason ? `${baseMessage} Reason: ${reason}` : baseMessage;
    super(fullMessage);
  }
}
