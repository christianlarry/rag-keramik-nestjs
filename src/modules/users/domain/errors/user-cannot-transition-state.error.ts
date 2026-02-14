import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class UserCannotTransitionStateError extends DomainError {
  readonly code = UserErrorCode.CANNOT_TRANSITION_STATE;

  constructor(message: string = 'User cannot transition to the requested state.') {
    super(message);
  }
}
