import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enums";

export class UserNotFoundError extends DomainError {
  readonly code = UserErrorCode.USER_NOT_FOUND;
  constructor(userId: string) {
    super(`User with ID ${userId} not found.`);
  }
}