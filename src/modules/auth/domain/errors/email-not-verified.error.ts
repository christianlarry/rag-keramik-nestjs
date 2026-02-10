import { DomainError } from "src/common/errors/domain.error";
import { AuthErrorCode } from "./enums/auth-error-code.enum";

export class EmailNotVerifiedError extends DomainError {
  readonly code = AuthErrorCode.EMAIL_NOT_VERIFIED;

  constructor(message = 'Email address has not been verified.') {
    super(message);
  }
}