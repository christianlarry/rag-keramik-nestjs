import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when attempting to create a user with an email that already exists.
 */
export class UserEmailAlreadyExistsError extends DomainError {
  readonly code = UserErrorCode.USER_EMAIL_ALREADY_EXISTS;
  constructor(email: string) {
    super(`User with email '${email}' already exists.`);
  }
}