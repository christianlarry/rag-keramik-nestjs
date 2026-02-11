import { DomainError } from "src/core/domain/domain-error.base";
import { TokenErrorCode } from "./token-error-code.enum";

export class TokenInvalidError extends DomainError {
  readonly code = TokenErrorCode.TOKEN_INVALID;

  constructor(message: string = 'Token is invalid') {
    super(message);
  }
}