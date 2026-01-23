/**
 * Static class for managing user cache keys
 * Provides centralized cache key generation for user-related data
 */
export class UserCacheKeys {
  private static readonly PREFIX = 'user:';

  /**
   * Cache key for user by ID
   * TTL: 5 minutes (300 seconds)
   */
  static byId(userId: string): string {
    return `${this.PREFIX}id:${userId}`;
  }

  /**
   * Cache key for user by email
   * TTL: 5 minutes (300 seconds)
   */
  static byEmail(email: string): string {
    return `${this.PREFIX}email:${email}`;
  }

  /**
   * Cache key for user list (with pagination and filters)
   * TTL: 2 minutes (120 seconds)
   */
  static list(params: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): string {
    const { page = 1, limit = 20, role, search } = params;
    const filters = [];

    if (role) filters.push(`role:${role}`);
    if (search) filters.push(`search:${search}`);

    const filterStr = filters.length > 0 ? `:${filters.join(':')}` : '';
    return `${this.PREFIX}list:page:${page}:limit:${limit}${filterStr}`;
  }

  /**
   * Cache key for email existence check
   * TTL: 10 minutes (600 seconds)
   */
  static emailExists(email: string): string {
    return `${this.PREFIX}email-exists:${email}`;
  }

  /**
   * Pattern to invalidate all user-related cache
   */
  static get allPattern(): string {
    return `${this.PREFIX}*`;
  }

  /**
   * Pattern to invalidate specific user cache (by ID)
   */
  static userPattern(userId: string): string {
    return `${this.PREFIX}*:${userId}*`;
  }

  /**
   * Pattern to invalidate all user list cache
   */
  static get listPattern(): string {
    return `${this.PREFIX}list:*`;
  }
}
