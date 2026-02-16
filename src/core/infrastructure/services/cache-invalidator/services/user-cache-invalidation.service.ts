import { Injectable, Logger } from "@nestjs/common";
import { CacheService } from "../../cache/cache.service";
import { UserCache } from "src/modules/users/infrastructure/cache/user.cache";
import { UserAuthCache } from "src/modules/auth/infrastructure/cache/user-auth.cache";
import { PrismaService } from "src/core/infrastructure/persistence/prisma/prisma.service";

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

  private readonly logger = new Logger(UserCacheInvalidationService.name);

  constructor(
    private readonly cache: CacheService,
    private readonly prismaService: PrismaService
  ) { }

  /**
   * Invalidate all cache entries related to a user (both Auth and Users modules)
   * 
   * @param userId - The user ID to invalidate cache for
   * @param email - Optional email address for email-based cache keys
   * @param phone - Optional phone number for phone-based cache keys
   */
  async invalidateUserCache(userId: string, email?: string): Promise<void> {

    let userEmail = email;
    try {
      const user = await this.prismaService.user.findUnique({ where: { id: userId }, select: { email: true } })
      if (user) {
        userEmail = user.email;
      }
    } catch (err) {
      this.logger.error(`Failed to retrieve user email for userId: ${userId}`, err);
      // Continue with provided email if available, otherwise proceed without email-based cache invalidation
    }

    // Collect all cache keys that need to be invalidated
    const exactKeys = [
      // Users module cache keys
      ...UserCache.getInvalidationKeys(userId, userEmail),

      // Auth module cache keys
      ...UserAuthCache.getInvalidationKeys(userId, userEmail),
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
    try {
      // Fetch userId from database
      const user = await this.prismaService.user.findUnique({
        where: { email },
        select: { id: true }
      });

      if (user) {
        await this.invalidateUserCache(user.id, email);
      } else {
        // User not found, just invalidate email cache
        await this.cache.del(UserAuthCache.getUserByEmailKey(email));
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate cache by email: ${email}`, error);
      throw error;
    }
  }

  /**
   * Force increment list versions without invalidating specific user cache
   * Useful for bulk operations
   */
  async invalidateAllListCaches(): Promise<void> {
    await this.incrementListVersions();
  }
}
