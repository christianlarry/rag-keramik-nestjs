import { DomainError } from "src/common/errors/domain.error";
import { AuthErrorCode } from "../auth-error-code.enum";

export class EmailFormatInvalidError extends DomainError {
  readonly code = AuthErrorCode.EmailFormatInvalid;

  constructor(message = 'The provided email format is invalid.') {
    super(message);
  }
}