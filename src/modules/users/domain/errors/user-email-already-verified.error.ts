import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when attempting to verify an email that has already been verified.
 */
export class UserEmailAlreadyVerifiedError extends DomainError {
  readonly code = UserErrorCode.USER_EMAIL_ALREADY_VERIFIED;
  constructor(email?: string) {
    super(
      email
        ? `Email '${email}' has already been verified.`
        : "Email has already been verified."
    );
  }
}
