import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

type UserIdentifier = {
  field: 'id' | 'email';
  value: string;
}

/**
 * Error thrown when a user is not found.
 * @constructor identifier - Optional identifier to specify which user was not found.
 */
export class UserNotFoundError extends DomainError {
  readonly code = UserErrorCode.USER_NOT_FOUND;
  constructor(identifier?: UserIdentifier) {
    if (!identifier) {
      super(`User not found.`);
      return;
    }
    super(`User with ${identifier.field} ${identifier.value} not found.`);
  }
}