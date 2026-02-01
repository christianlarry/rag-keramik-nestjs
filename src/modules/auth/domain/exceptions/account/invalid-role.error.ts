import { DomainError } from 'src/common/errors/domain.error';
import { AuthErrorCode } from '../auth-error-code.enum';

/**
 * Error thrown when an invalid role is provided.
 */
export class InvalidRoleError extends DomainError {
  readonly code = AuthErrorCode.InvalidRole;

  constructor(role?: string) {
    super(
      role
        ? `Invalid role: ${role}. Must be one of: ADMIN, STAFF, CUSTOMER.`
        : 'Invalid role specified.',
    );
  }
}
