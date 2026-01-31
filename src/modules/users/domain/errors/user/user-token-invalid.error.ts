import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "../enums/user-error-code.enum";

/**
 * Error thrown when user token is invalid.
 */
export class UserTokenInvalidError extends DomainError {
  readonly code = UserErrorCode.USER_TOKEN_INVALID;
  constructor(tokenType?: string) {
    super(
      tokenType
        ? `${tokenType} token is invalid.`
        : "Token is invalid."
    );
  }
}
