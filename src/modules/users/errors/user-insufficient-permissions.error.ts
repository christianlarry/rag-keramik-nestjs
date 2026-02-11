import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when a user has insufficient permissions for an operation.
 */
export class UserInsufficientPermissionsError extends DomainError {
  readonly code = UserErrorCode.USER_INSUFFICIENT_PERMISSIONS;
  constructor(requiredPermission?: string) {
    super(
      requiredPermission
        ? `User lacks required permission: ${requiredPermission}.`
        : "User has insufficient permissions."
    );
  }
}
