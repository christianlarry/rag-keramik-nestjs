import { DomainError } from "src/common/errors/domain.error";
import { EmailErrorCode } from "../enums/email-error-code.enum";

export class EmailAlreadyVerifiedError extends DomainError {
  readonly code = EmailErrorCode.EMAIL_ALREADY_VERIFIED;

  constructor(message?: string) {
    super(message ?? 'The email has already been verified.');
  }
}