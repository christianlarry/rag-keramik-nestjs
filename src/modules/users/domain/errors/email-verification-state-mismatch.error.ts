import { DomainError } from "src/common/errors/domain.error";
import { EmailErrorCode } from "./enums/email-error-code.enum";

export class EmailVerificationStateMismatchError extends DomainError {
  readonly code = EmailErrorCode.EMAIL_VERIFICATION_STATE_MISMATCH;

  constructor(message?: string) {
    super(message ?? 'The email verification state does not match the verifiedAt date.');
  }
}
