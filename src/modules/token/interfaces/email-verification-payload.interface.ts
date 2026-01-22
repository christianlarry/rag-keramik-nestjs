import { TokenType } from "../enums/token-type.enum";

export interface IEmailVerificationPayload {
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
   * Token type untuk membedakan email verification token
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
   * JWT ID - unique identifier untuk token
   */
  jti?: string;
}