import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when user attempts to change their own role.
 */
export class UserCannotChangeOwnRoleError extends DomainError {
  readonly code = UserErrorCode.USER_CANNOT_CHANGE_OWN_ROLE;
  constructor() {
    super("You cannot change your own role. Please contact an administrator.");
  }
}
