import { DomainError } from "src/common/errors/domain.error";
import { AuthErrorCode } from "./enums/auth-error-code.enum";

export class CannotForgotPasswordError extends DomainError {
  readonly code = AuthErrorCode.CANNOT_FORGOT_PASSWORD;

  constructor(message: string = 'Cannot forgot password for this user.') {
    super(message);
  }
}