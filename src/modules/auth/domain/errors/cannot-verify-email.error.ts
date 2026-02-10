import { DomainError } from "src/common/errors/domain.error";
import { AuthErrorCode } from "./enums/auth-error-code.enum";

export class CannotVerifyEmailError extends DomainError {
  readonly code = AuthErrorCode.CANNOT_VERIFY_EMAIL;

  constructor(message: string = 'Failed to verify email') {
    super(message);
  }
}