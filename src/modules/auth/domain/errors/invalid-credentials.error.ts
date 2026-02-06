import { DomainError } from "src/common/errors/domain.error";
import { AuthErrorCode } from "./enums/auth-error-code.enum";

export class InvalidCredentialsError extends DomainError {
  readonly code = AuthErrorCode.INVALID_CREDENTIALS;

  constructor() {
    super('The provided credentials are invalid.');
  }
}