import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class InvalidEmailError extends DomainError {
  readonly code = UserErrorCode.INVALID_EMAIL;
  constructor(email: string) {
    super(`Invalid Email: ${email}`);
  }
}