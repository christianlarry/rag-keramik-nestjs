import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class UserNotFoundError extends DomainError {
  readonly code = UserErrorCode.NOT_FOUND;

  constructor(message?: string) {
    super(message || 'User not found');
  }
}