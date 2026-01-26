import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "./enums/user-error-code.enum";

/**
 * Error thrown when avatar upload fails.
 */
export class UserAvatarUploadFailedError extends DomainError {
  readonly code = UserErrorCode.USER_AVATAR_UPLOAD_FAILED;
  constructor(reason?: string) {
    super(
      reason
        ? `Avatar upload failed. Reason: ${reason}`
        : "Avatar upload failed. Please try again."
    );
  }
}
