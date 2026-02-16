/**
 * UserCache
 * 
 * Utility class for managing user profile-related cache keys and TTL configurations.
 * Provides static methods for generating cache keys with consistent prefixes.
 * 
 * Note: This is separate from auth-related caching (UserAuthCache).
 * This cache is specifically for user profile data in the Users bounded context.
 */
export class UserCache {
  // ===== Cache Key Prefixes ===== //
  static readonly USER_BY_ID_PREFIX = 'user:profile:id:';
  static readonly USER_BY_EMAIL_PREFIX = 'user:profile:email:';
  static readonly USER_BY_PHONE_PREFIX = 'user:profile:phone:';
  static readonly USER_STATS_PREFIX = 'user:profile:stats:';
  static readonly USER_DETAIL_BY_ID_PREFIX = 'user:profile:detail:id:';
  static readonly USER_LIST_PREFIX = 'user:profile:list:';
  static readonly USER_LIST_VERSION_KEY = 'user:profile:list:version';

  // ===== TTL Configurations (in seconds) ===== //
  static readonly USER_DETAIL_TTL = 300; // 5 minutes
  static readonly USER_LIST_TTL = 120; // 2 minutes
  static readonly USER_STATS_TTL = 300; // 5 minutes

  // ===== Key Generator Methods ===== //

  /**
   * Generate cache key for user profile by ID
   */
  static getUserByIdKey(userId: string): string {
    return `${this.USER_BY_ID_PREFIX}${userId}`;
  }

  /**
   * Generate cache key for user profile by email
   */
  static getUserByEmailKey(email: string): string {
    return `${this.USER_BY_EMAIL_PREFIX}${email.toLowerCase()}`;
  }

  /**
   * Generate cache key for user profile by phone number
   */
  static getUserByPhoneKey(phoneNumber: string): string {
    return `${this.USER_BY_PHONE_PREFIX}${phoneNumber}`;
  }

  /**
   * Generate cache key for user list with pagination and filters
   * @param params - Pagination, filter parameters, and cache version
   * @param params.version - Cache version number (retrieved from getUserListVersionKey)
   */
  static getUserListKey(params: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    version?: number;
  }): string {
    const { page = 1, limit = 20, role, status, version = 0 } = params;
    const filters = [];

    if (role) filters.push(`role:${role}`);
    if (status) filters.push(`status:${status}`);

    const filterStr = filters.length > 0 ? `:${filters.join(':')}` : '';
    return `${this.USER_LIST_PREFIX}v${version}:page:${page}:limit:${limit}${filterStr}`;
  }

  /**
   * Get the cache key for user list version
   * This key stores a version number that is incremented on user changes.
   * When the version changes, all cached lists become stale automatically.
   */
  static getUserListVersionKey(): string {
    return this.USER_LIST_VERSION_KEY;
  }

  /**
   * Generate cache key for user statistics
   */
  static getUserStatsKey(): string {
    return `${this.USER_STATS_PREFIX}all`;
  }

  static getUserDetailByIdKey(userId: string): string {
    return `${this.USER_DETAIL_BY_ID_PREFIX}${userId}`;
  }

  // ===== Cache Invalidation Helpers ===== //

  /**
   * Get all cache keys that should be invalidated when a user is updated.
   * Note: For list caches, we increment the version key instead of using wildcard deletion.
   * The application should:
   * 1. Delete the keys returned by this method
   * 2. Increment the value at getUserListVersionKey() (e.g., INCR command in Redis)
   */
  static getInvalidationKeys(
    userId: string,
    email?: string,
    phoneNumber?: string
  ): string[] {
    const keys = [
      this.getUserByIdKey(userId),
      this.getUserDetailByIdKey(userId),
      this.getUserStatsKey(),
      // Note: getUserListVersionKey() should be incremented (INCR), not deleted
      // This invalidates all list caches without wildcard deletion
    ];

    if (email) {
      keys.push(this.getUserByEmailKey(email));
    }

    if (phoneNumber) {
      keys.push(this.getUserByPhoneKey(phoneNumber));
    }

    return keys;
  }
}
