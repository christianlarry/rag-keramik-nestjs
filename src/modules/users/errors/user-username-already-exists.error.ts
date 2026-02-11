import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when attempting to create a user with a username that already exists.
 */
export class UserUsernameAlreadyExistsError extends DomainError {
  readonly code = UserErrorCode.USER_USERNAME_ALREADY_EXISTS;
  constructor(username: string) {
    super(`User with username '${username}' already exists.`);
  }
}
