import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "../enums/user-error-code.enum";

/**
 * Error thrown when user token has expired.
 */
export class UserTokenExpiredError extends DomainError {
  readonly code = UserErrorCode.USER_TOKEN_EXPIRED;
  constructor(tokenType?: string) {
    super(
      tokenType
        ? `${tokenType} token has expired.`
        : "Token has expired."
    );
  }
}
