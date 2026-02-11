import { DomainError } from "src/common/errors/domain.error";
import { AuthErrorCode } from "./enums/auth-error-code.enum";

export class CannotChangePasswordError extends DomainError {
  readonly code = AuthErrorCode.CANNOT_CHANGE_PASSWORD;

  constructor(message: string = 'Cannot change password due to invalid user state.') {
    super(message);
  }
}