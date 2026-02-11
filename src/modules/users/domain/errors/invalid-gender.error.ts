import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class InvalidGenderError extends DomainError {
  readonly code = UserErrorCode.INVALID_GENDER;

  constructor(gender: string) {
    super(`Invalid gender: ${gender}. Must be either 'male' or 'female'.`);
  }
}
