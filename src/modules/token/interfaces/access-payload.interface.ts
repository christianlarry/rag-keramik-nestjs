import { Role } from "src/generated/prisma/enums";
import { TokenType } from "../enums/token-type.enum";

export interface IAccessPayload {
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
  role: Role;

  /**
   * Token type untuk membedakan access token vs refresh token
   */
  type: TokenType.ACCESS;

  /**
   * Issued at - timestamp kapan token dibuat (Unix timestamp dalam seconds)
   */
  iat?: number;

  /**
   * Expiration time - timestamp kapan token expire (Unix timestamp dalam seconds)
   */
  exp?: number;

  /**
   * JWT ID - unique identifier untuk token
   */
  jti?: string;
}