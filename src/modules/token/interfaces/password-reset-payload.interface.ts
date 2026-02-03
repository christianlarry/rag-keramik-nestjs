import { TokenType } from "../enums/token-type.enum";

export interface IPasswordResetPayload {
  /**
     * User ID (UUID)
     * Subject claim dari JWT - mengidentifikasi user
     */
  sub: string;

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
   * JWT ID - unique identifier untuk token
   * Fungsi : untuk memastikan token reset password hanya bisa digunakan sekali
   */
  jti?: string;
}