import { DomainError } from "src/common/errors/domain.error";
import { UserErrorCode } from "../enums/user-error-code.enum";

/**
 * Error thrown when user profile is incomplete and required fields are missing.
 */
export class UserProfileIncompleteError extends DomainError {
  readonly code = UserErrorCode.USER_PROFILE_INCOMPLETE;
  constructor(missingFields?: string[]) {
    super(
      missingFields && missingFields.length > 0
        ? `User profile is incomplete. Missing fields: ${missingFields.join(", ")}.`
        : "User profile is incomplete. Please complete your profile."
    );
  }
}
