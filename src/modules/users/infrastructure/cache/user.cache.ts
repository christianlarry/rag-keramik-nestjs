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
  static readonly USER_LIST_PREFIX = 'user:profile:list:';
  static readonly USER_STATS_PREFIX = 'user:profile:stats:';

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
   */
  static getUserListKey(params: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): string {
    const { page = 1, limit = 20, role, status, search } = params;
    const filters = [];

    if (role) filters.push(`role:${role}`);
    if (status) filters.push(`status:${status}`);
    if (search) filters.push(`search:${search}`);

    const filterStr = filters.length > 0 ? `:${filters.join(':')}` : '';
    return `${this.USER_LIST_PREFIX}page:${page}:limit:${limit}${filterStr}`;
  }

  /**
   * Generate cache key for user statistics
   */
  static getUserStatsKey(): string {
    return `${this.USER_STATS_PREFIX}all`;
  }

  // ===== Cache Invalidation Helpers ===== //

  /**
   * Get all cache keys that should be invalidated when a user is updated
   */
  static getInvalidationKeys(userId: string, email?: string, phoneNumber?: string): string[] {
    const keys = [this.getUserByIdKey(userId)];

    if (email) {
      keys.push(this.getUserByEmailKey(email));
    }

    if (phoneNumber) {
      keys.push(this.getUserByPhoneKey(phoneNumber));
    }

    return keys;
  }
}
