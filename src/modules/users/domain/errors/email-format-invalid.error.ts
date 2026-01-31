import { DomainError } from "src/common/errors/domain.error";
import { EmailErrorCode } from "./enums/email-error-code.enum";

export class EmailFormatInvalidError extends DomainError {
  readonly code = EmailErrorCode.EMAIL_FORMAT_INVALID;

  constructor(message?: string) {
    super(message ?? 'The provided email format is invalid.');
  }
}