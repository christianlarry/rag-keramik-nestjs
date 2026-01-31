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
  static list(params: UserSearchCriteria): string {
    const {
      page = 1,
      pageSize = 20,
      role,
      status,
      searchTerm,
      sortBy = 'createdAt',
      sortOrder = 'asc',
      emailVerified,
      provider,
      createdAfter,
      createdBefore,
    } = params;

    const filters = [];

    if (role) filters.push(`role:${role}`);
    if (status) filters.push(`status:${status}`);
    if (searchTerm) filters.push(`search:${searchTerm}`);
    if (sortBy) filters.push(`sortBy:${sortBy}`);
    if (sortOrder) filters.push(`sortOrder:${sortOrder}`);
    if (emailVerified !== undefined) filters.push(`verified:${emailVerified}`);
    if (provider) filters.push(`provider:${provider}`);
    if (createdAfter) filters.push(`after:${createdAfter.toISOString()}`);
    if (createdBefore) filters.push(`before:${createdBefore.toISOString()}`);

    const filterStr = filters.length > 0 ? `:${filters.join(':')}` : '';
    return `${this.PREFIX}list:page:${page}:size:${pageSize}${filterStr}`;
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

  /**
   * Cache key for user refresh tokens
   * TTL: 7 days (604800 seconds)
   */
  static refreshTokens(userId: string): string {
    return `${this.PREFIX}refresh-tokens:${userId}`;
  }

  /**
   * Cache key for user authentication data by ID
   * TTL: 5 minutes (300 seconds)
   */
  static authDataById(userId: string): string {
    return `${this.PREFIX}auth:id:${userId}`;
  }

  /**
   * Cache key for user authentication data by email
   * TTL: 5 minutes (300 seconds)
   */
  static authDataByEmail(email: string): string {
    return `${this.PREFIX}auth:email:${email}`;
  }

  /**
   * Cache key for user profile
   * TTL: 5 minutes (300 seconds)
   */
  static profile(userId: string): string {
    return `${this.PREFIX}profile:${userId}`;
  }

  /**
   * Cache key for user list item
   * TTL: 5 minutes (300 seconds)
   */
  static listItem(userId: string): string {
    return `${this.PREFIX}list-item:${userId}`;
  }

  /**
   * Cache key for user avatar URL
   * TTL: 10 minutes (600 seconds)
   */
  static avatarUrl(userId: string): string {
    return `${this.PREFIX}avatar:${userId}`;
  }

  /**
   * Cache key for user display name
   * TTL: 5 minutes (300 seconds)
   */
  static displayName(userId: string): string {
    return `${this.PREFIX}display-name:${userId}`;
  }

  /**
   * Cache key for batch user data
   * TTL: 5 minutes (300 seconds)
   */
  static batchByIds(ids: string[]): string {
    const sortedIds = [...ids].sort().join(',');
    return `${this.PREFIX}batch:ids:${sortedIds}`;
  }

  /**
   * Cache key for batch auth data
   * TTL: 5 minutes (300 seconds)
   */
  static batchAuthData(ids: string[]): string {
    const sortedIds = [...ids].sort().join(',');
    return `${this.PREFIX}batch-auth:ids:${sortedIds}`;
  }

  /**
   * Cache key for user existence check
   * TTL: 10 minutes (600 seconds)
   */
  static exists(userId: string): string {
    return `${this.PREFIX}exists:${userId}`;
  }

  /**
   * Cache key for batch existence check
   * TTL: 10 minutes (600 seconds)
   */
  static existsBatch(ids: string[]): string {
    const sortedIds = [...ids].sort().join(',');
    return `${this.PREFIX}exists-batch:ids:${sortedIds}`;
  }

  /**
   * Cache key for user search results
   * TTL: 2 minutes (120 seconds)
   */
  static search(term: string, page: number = 0, limit: number = 50, includeInactive: boolean = false): string {
    return `${this.PREFIX}search:term:${term}:page:${page}:limit:${limit}:inactive:${includeInactive}`;
  }

  /**
   * Cache key for users by role
   * TTL: 5 minutes (300 seconds)
   */
  static byRole(role: string, page: number = 0, limit: number = 20): string {
    return `${this.PREFIX}role:${role}:page:${page}:limit:${limit}`;
  }

  /**
   * Cache key for user count
   * TTL: 5 minutes (300 seconds)
   */
  static count(criteria?: UserCountOnSearchCriteria): string {
    if (!criteria) {
      return `${this.PREFIX}count:all`;
    }

    const filters = [];

    if (criteria.role) filters.push(`role:${criteria.role}`);
    if (criteria.status) filters.push(`status:${criteria.status}`);
    if (criteria.searchTerm) filters.push(`search:${criteria.searchTerm}`);
    if (criteria.emailVerified !== undefined) filters.push(`verified:${criteria.emailVerified}`);
    if (criteria.provider) filters.push(`provider:${criteria.provider}`);
    if (criteria.createdAfter) filters.push(`after:${criteria.createdAfter.toISOString()}`);
    if (criteria.createdBefore) filters.push(`before:${criteria.createdBefore.toISOString()}`);

    const filterStr = filters.length > 0 ? `:${filters.join(':')}` : '';
    return `${this.PREFIX}count${filterStr}`;
  }
}
