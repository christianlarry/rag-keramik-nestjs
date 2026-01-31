import { DomainError } from "src/common/errors/domain.error";
import { PasswordErrorCode } from "../enums/password-error-code.enum";

export class PasswordMissingError extends DomainError {
  readonly code = PasswordErrorCode.PASSWORD_MISSING;
  constructor(message?: string) {
    super(
      message ||
      "Password is missing. A valid password must be provided for local authentication."
    );
  }
}