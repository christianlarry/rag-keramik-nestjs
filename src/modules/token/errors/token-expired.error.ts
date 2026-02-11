import { DomainError } from "src/core/domain/domain-error.base";
import { TokenErrorCode } from "./token-error-code.enum";

export class TokenExpiredError extends DomainError {
  readonly code = TokenErrorCode.TOKEN_EXPIRED;

  constructor(message: string = 'Token has expired') {
    super(message);
  }
}