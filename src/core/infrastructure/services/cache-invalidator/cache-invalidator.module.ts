import { Module } from "@nestjs/common";
import { UserCacheInvalidationService } from "./services/user-cache-invalidation.service";
import { UnifiedUserCacheInvalidationListener } from "./listeners/unified-user-cache-invalidation.listener";

// Legacy listeners (kept for reference, but replaced by UnifiedUserCacheInvalidationListener)
// import { InvalidateAuthUserCacheListener } from "./listeners/invalidate-auth-user-cache.listener";
// import { InvalidateUserCacheListener } from "./listeners/invalidate-user-cache.listener";

/**
 * Cache Invalidator Module
 * 
 * Provides centralized cache invalidation services and listeners for the application.
 * 
 * Architecture:
 * - UserCacheInvalidationService: Centralized service that knows about all user cache keys
 * - UnifiedUserCacheInvalidationListener: Single listener for ALL user-related events
 * 
 * Why Unified Approach?
 * - Auth and Users modules share the same database table
 * - Changes in one module affect the other module's cache
 * - Single listener + service ensures consistency and reduces duplication
 * - Easier to maintain and debug
 * 
 * Migration from legacy:
 * - Previously: 2 separate listeners (InvalidateAuthUserCacheListener + InvalidateUserCacheListener)
 * - Now: 1 unified listener + 1 service (better separation of concerns)
 */
@Module({
  providers: [
    // Services
    UserCacheInvalidationService,

    // Listeners
    UnifiedUserCacheInvalidationListener,

    // Legacy listeners (deprecated - replaced by UnifiedUserCacheInvalidationListener)
    // InvalidateAuthUserCacheListener,
    // InvalidateUserCacheListener,
  ],
  exports: [
    // Export service so other modules can use it if needed
    UserCacheInvalidationService,
  ],
})
export class CacheInvalidatorModule { }