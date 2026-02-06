import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class InvalidAvatarError extends DomainError {
  readonly code = UserErrorCode.INVALID_AVATAR;

  constructor(message: string = 'The provided avatar URL is invalid.') {
    super(message);
  }
}