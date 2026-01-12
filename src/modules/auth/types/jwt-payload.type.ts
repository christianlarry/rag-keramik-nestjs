import { Role } from 'src/generated/prisma/enums';
import { JwtTokenType } from '../enums/jwt-payload-type.enum';

/**
 * JWT Payload interface yang akan dimasukkan ke dalam Access Token
 * Setelah user login, informasi ini akan di-embed dalam JWT token
 */
export type JwtPayload = {
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
  type: JwtTokenType;

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
