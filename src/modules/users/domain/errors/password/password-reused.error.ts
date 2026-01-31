import { DomainError } from "src/common/errors/domain.error";
import { PasswordErrorCode } from "../enums/password-error-code.enum";

export class PasswordReusedError extends DomainError {
  readonly code = PasswordErrorCode.PASSWORD_REUSED;

  constructor(message: string = "The password has been used previously. Please choose a new password.") {
    super(message);
  }
}