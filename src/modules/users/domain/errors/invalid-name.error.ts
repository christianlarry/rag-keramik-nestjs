import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class InvalidNameError extends DomainError {
  readonly code = UserErrorCode.INVALID_NAME;

  constructor(message: string = 'The provided name is invalid.') {
    super(message);
  }
}