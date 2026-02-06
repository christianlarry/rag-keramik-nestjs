import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class UserStateConflictError extends DomainError {
  readonly code = UserErrorCode.STATE_CONFLICT;

  constructor(message: string = 'The user state is in conflict with the requested operation.') {
    super(message);
  }
}