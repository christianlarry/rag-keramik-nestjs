import { UserRole } from "src/modules/users/domain/entities/user.entity";

/**
 * Type untuk user object yang ada di request setelah JWT validation
 * Ini adalah object yang akan dimasukkan ke request.user oleh Passport JWT strategy
 */
export interface IRequestUser {
  /**
   * User ID (UUID)
   */
  id: string;

  /**
   * User email
   */
  email: string;

  /**
   * User role untuk authorization
   */
  role: UserRole;

  /**
   * User name (optional)
   */
  name?: string;

  /**
   * OAuth provider jika user login via OAuth (google, facebook, etc)
   */
  provider?: string;

  /**
   * Refresh token (optional)
   */
  refreshToken?: string;
}