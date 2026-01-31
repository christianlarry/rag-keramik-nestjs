import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "../enums/user-error-code.enum";

/**
 * Error thrown when attempting to perform an operation on a banned user.
 */
export class UserBannedError extends DomainError {
  readonly code = UserErrorCode.USER_BANNED;
  constructor(userId?: string, reason?: string) {
    const baseMessage = userId
      ? `User with ID '${userId}' is banned.`
      : "User is banned.";
    const fullMessage = reason ? `${baseMessage} Reason: ${reason}` : baseMessage;
    super(fullMessage);
  }
}
