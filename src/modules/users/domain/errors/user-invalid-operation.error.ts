import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class UserInvalidOperationError extends DomainError {
  readonly code = UserErrorCode.INVALID_OPERATION;

  constructor(message: string = 'The requested operation cannot be performed on this user.') {
    super(message);
  }
}
