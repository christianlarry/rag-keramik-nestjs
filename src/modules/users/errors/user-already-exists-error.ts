import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

type Context = {
  field: 'email' | 'username';
  value: string;
}

/**
 * Error thrown when attempting to create a user that already exists.
 * @constructor message - Custom message describing the error.
 */
export class UserAlreadyExistsError extends DomainError {
  readonly code = UserErrorCode.USER_ALREADY_EXISTS;
  constructor(context: Context) {
    super(`User with ${context.field} '${context.value}' already exists.`);
  }
}