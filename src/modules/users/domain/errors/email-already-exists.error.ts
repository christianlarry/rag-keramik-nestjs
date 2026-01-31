import { DomainError } from "src/common/errors/domain.error";
import { EmailErrorCode } from "./enums/email-error-code.enum";

export class EmailAlreadyExistsError extends DomainError {
  readonly code = EmailErrorCode.EMAIL_ALREADY_EXISTS;

  constructor(message?: string) {
    super(message ?? 'The email already exists.');
  }
}