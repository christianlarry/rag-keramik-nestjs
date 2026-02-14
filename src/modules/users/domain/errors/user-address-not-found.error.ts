import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class UserAddressNotFoundError extends DomainError {
  readonly code = UserErrorCode.ADDRESS_NOT_FOUND;

  constructor(message: string = 'The specified address was not found for this user.') {
    super(message);
  }
}
