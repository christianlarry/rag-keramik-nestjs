/**
 * UserAuthCache
 * 
 * Utility class for managing auth-related cache keys and TTL configurations.
 * Provides static methods for generating cache keys with consistent prefixes.
 */
export class UserAuthCache {
  // ===== Cache Key Prefixes ===== //
  static readonly USER_BY_ID_PREFIX = 'auth:user:id:';
  static readonly USER_BY_EMAIL_PREFIX = 'auth:user:email:';
  static readonly LOGIN_ATTEMPTS_PREFIX = 'auth:login-attempts:';
  static readonly REFRESH_TOKEN_PREFIX = 'auth:refresh-token:';
  static readonly EMAIL_VERIFICATION_PREFIX = 'auth:email-verify:';
  static readonly PASSWORD_RESET_PREFIX = 'auth:password-reset:';

  // ===== TTL Configurations (in seconds) ===== //
  static readonly USER_CACHE_TTL = 3600; // 1 hour
  static readonly LOGIN_ATTEMPTS_TTL = 900; // 15 minutes
  static readonly REFRESH_TOKEN_TTL = 2592000; // 30 days
  static readonly EMAIL_VERIFICATION_TTL = 3600; // 1 hour
  static readonly PASSWORD_RESET_TTL = 1800; // 30 minutes

  // ===== Key Generator Methods ===== //

  /**
   * Generate cache key for user by ID
   */
  static getUserByIdKey(userId: string): string {
    return `${this.USER_BY_ID_PREFIX}${userId}`;
  }

  /**
   * Generate cache key for user by email
   */
  static getUserByEmailKey(email: string): string {
    return `${this.USER_BY_EMAIL_PREFIX}${email.toLowerCase()}`;
  }

  /**
   * Generate cache key for login attempts tracking
   */
  static getLoginAttemptsKey(identifier: string): string {
    return `${this.LOGIN_ATTEMPTS_PREFIX}${identifier.toLowerCase()}`;
  }

  /**
   * Generate cache key for refresh token
   */
  static getRefreshTokenKey(tokenId: string): string {
    return `${this.REFRESH_TOKEN_PREFIX}${tokenId}`;
  }

  /**
   * Generate cache key for email verification token
   */
  static getEmailVerificationKey(token: string): string {
    return `${this.EMAIL_VERIFICATION_PREFIX}${token}`;
  }

  /**
   * Generate cache key for password reset token
   */
  static getPasswordResetKey(token: string): string {
    return `${this.PASSWORD_RESET_PREFIX}${token}`;
  }

  /**
   * Generate pattern for deleting all user-related caches
   */
  static getUserCachePattern(userId: string): string {
    return `auth:user:*${userId}*`;
  }

  /**
   * Generate pattern for deleting all caches by email
   */
  static getUserEmailCachePattern(email: string): string {
    return `auth:user:email:${email.toLowerCase()}*`;
  }
}
