import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when attempting to perform an operation that requires email verification.
 */
export class UserEmailNotVerifiedError extends DomainError {
  readonly code = UserErrorCode.USER_EMAIL_NOT_VERIFIED;
  constructor(email?: string) {
    super(
      email
        ? `Email '${email}' is not verified. Please verify your email to continue.`
        : "Email is not verified. Please verify your email to continue."
    );
  }
}
