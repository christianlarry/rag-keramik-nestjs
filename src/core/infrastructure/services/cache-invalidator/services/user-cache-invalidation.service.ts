import { Injectable } from "@nestjs/common";
import { CacheService } from "../../cache/cache.service";
import { UserCache } from "src/modules/users/infrastructure/cache/user.cache";
import { UserAuthCache } from "src/modules/auth/infrastructure/cache/user-auth.cache";

/**
 * Centralized service for invalidating ALL user-related caches.
 * 
 * This service knows about both Auth and Users cache keys and ensures
 * consistency across modules when user data changes anywhere in the system.
 * 
 * Why this approach?
 * - Auth and Users modules share the same database table
 * - Changes in one module affect the other module's cached data
 * - This service provides a single source of truth for cache invalidation
 * 
 * Usage:
 * - Call from event listeners when user data changes
 * - Automatically invalidates both Auth and Users module caches
 * - Handles list cache version incrementing
 */
@Injectable()
export class UserCacheInvalidationService {
  constructor(
    private readonly cache: CacheService
  ) { }

  /**
   * Invalidate all cache entries related to a user (both Auth and Users modules)
   * 
   * @param userId - The user ID to invalidate cache for
   * @param email - Optional email address for email-based cache keys
   * @param phone - Optional phone number for phone-based cache keys
   */
  async invalidateUserCache(userId: string, email?: string): Promise<void> {
    // Collect all cache keys that need to be invalidated
    const exactKeys = [
      // Users module cache keys
      ...UserCache.getInvalidationKeys(userId, email),

      // Auth module cache keys
      ...UserAuthCache.getInvalidationKeys(userId, email),
    ].filter(Boolean) as string[];

    // Delete all exact cache keys in parallel
    await Promise.all(exactKeys.map(key => this.cache.del(key)));

    // Increment list cache versions to invalidate all cached lists
    await this.incrementListVersions();
  }

  /**
   * Increment version numbers for list caches.
   * This is more efficient than using wildcard deletion.
   * When version number changes, all cached lists with old version become stale.
   */
  private async incrementListVersions(): Promise<void> {
    const versionKeys = [
      UserCache.getUserListVersionKey(),
      // Future: Add Auth list version key if needed
    ];

    await Promise.all(
      versionKeys.map(async (key) => {
        try {
          await this.cache.incr(key);
        } catch {
          // If key doesn't exist, initialize it to 1
          await this.cache.set(key, '1', 86400); // 24 hours TTL
        }
      })
    );
  }

  /**
   * Invalidate user cache by email only
   * Useful when you only have email but not userId
   */
  async invalidateUserCacheByEmail(email: string): Promise<void> {
    const exactKeys = [
      UserAuthCache.getUserByEmailKey(email),
    ];

    await Promise.all(exactKeys.map(key => this.cache.del(key)));
  }

  /**
   * Force increment list versions without invalidating specific user cache
   * Useful for bulk operations
   */
  async invalidateAllListCaches(): Promise<void> {
    await this.incrementListVersions();
  }
}
