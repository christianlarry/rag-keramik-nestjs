import { DomainError } from "src/common/errors/domain.error";
import { EmailErrorCode } from "./enums/email-error-code.enum";

export class EmailNotVerifiedError extends DomainError {
  readonly code = EmailErrorCode.EMAIL_NOT_VERIFIED;
  constructor(message: string = "The email address has not been verified.") {
    super(message);
  }
}