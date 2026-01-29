import { UserRole } from "src/modules/users/domain/types/user.type";
import { TokenType } from "../enums/token-type.enum";

export interface IRefreshPayload {
  /**
     * User ID (UUID)
     * Subject claim dari JWT - mengidentifikasi user
     */
  sub: string;

  /**
   * User email
   */
  email: string;

  /**
   * User role untuk authorization
   */
  role: UserRole;

  /**
   * Token type untuk membedakan access token vs refresh token
   */
  type: TokenType;

  /**
   * Issued at - timestamp kapan token dibuat (Unix timestamp dalam seconds)
   */
  iat?: number;

  /**
   * Expiration time - timestamp kapan token expire (Unix timestamp dalam seconds)
   */
  exp?: number;

  /**
   * JWT ID - unique identifier untuk token (digunakan untuk refresh token revocation)
   */
  jti?: string;
}