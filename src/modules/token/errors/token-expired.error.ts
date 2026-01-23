import { DomainError } from "src/common/errors/domain.error";
import { TokenErrorCode } from "./token-error-code.enum";

export class TokenExpiredError extends DomainError {
  readonly code = TokenErrorCode.TOKEN_EXPIRED;

  constructor(message: string = 'Token has expired') {
    super(message);
  }
}