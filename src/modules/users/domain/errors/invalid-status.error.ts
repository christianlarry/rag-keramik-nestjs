import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class InvalidStatusError extends DomainError {
  readonly code = UserErrorCode.INVALID_STATUS;

  constructor(status: string) {
    super(`Invalid status: ${status}`);
  }
}