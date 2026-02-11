import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class InvalidRoleError extends DomainError {
  readonly code = UserErrorCode.INVALID_ROLE;

  constructor(role: string) {
    super(`The role '${role}' is invalid.`);
  }
}