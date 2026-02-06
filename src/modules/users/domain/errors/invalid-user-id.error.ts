import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class InvalidUserIdError extends DomainError {
  readonly code = UserErrorCode.INVALID_USER_ID;
  constructor(userId: string) {
    super(`Invalid User ID: ${userId}`);
  }
}