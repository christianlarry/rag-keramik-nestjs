import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class InvalidDateOfBirthError extends DomainError {
  readonly code = UserErrorCode.INVALID_DATE_OF_BIRTH;

  constructor(message: string = 'Invalid date of birth provided.') {
    super(message);
  }
}
