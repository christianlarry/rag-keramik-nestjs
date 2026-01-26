import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when email format is invalid (domain-level validation).
 */
export class UserEmailInvalidError extends DomainError {
  readonly code = UserErrorCode.USER_EMAIL_INVALID;
  constructor(email?: string) {
    super(
      email
        ? `Email '${email}' is invalid.`
        : "Email address is invalid."
    );
  }
}
