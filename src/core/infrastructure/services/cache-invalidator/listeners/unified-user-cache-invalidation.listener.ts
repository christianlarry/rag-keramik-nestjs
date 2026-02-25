import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { DomainEvent } from "src/core/domain/domain-event.base";
import { UserCacheInvalidationService } from "../services/user-cache-invalidation.service";

// Auth Module Events
import { AuthUserUpdatedEvent } from "src/modules/auth/domain/events/auth-user-updated.event";
import { UserRegisteredEvent } from "src/modules/auth/domain/events/user-registered.event";
import { UserCreatedFromOAuthEvent } from "src/modules/auth/domain/events/user-created-from-oauth.event";

// Users Module Events
import { UserUpdatedEvent } from "src/modules/users/domain/events/user-updated.event";

/**
 * Unified listener for invalidating ALL user-related caches across modules.
 * 
 * This listener handles domain events from BOTH Auth and Users modules because
 * they share the same underlying database table. When data changes in one module,
 * the cache in the other module must also be invalidated to maintain consistency.
 * 
 * Architecture Decision:
 * - Auth and Users modules use the same "users" table
 * - Changes in Auth (e.g., email verified, password changed) affect Users cache
 * - Changes in Users (e.g., profile updated, status changed) affect Auth cache
 * - This centralized listener + service ensures consistency across both modules
 * 
 * Events Handled:
 * - 14 Auth module events (registration, login, password, email, OAuth, status)
 * - 13 Users module events (profile, phone, address, status)
 * - Total: 27 events that trigger cache invalidation
 * 
 * Cache Strategy:
 * - Invalidates specific user cache entries (by ID, email)
 * - Increments list cache versions to invalidate all cached lists
 * - Uses centralized UserCacheInvalidationService for consistency
 */
@Injectable()
export class UnifiedUserCacheInvalidationListener {

  private readonly logger = new Logger(UnifiedUserCacheInvalidationListener.name);

  constructor(
    private readonly userCacheInvalidation: UserCacheInvalidationService
  ) { }

  // ==================== AUTH MODULE EVENTS ==================== //

  @OnEvent(UserRegisteredEvent.EventName, { async: true })
  @OnEvent(UserCreatedFromOAuthEvent.EventName, { async: true })
  @OnEvent(AuthUserUpdatedEvent.EventName, { async: true })
  /* DEPRECATED: No handle by general UserUpdatedEvent for state change.
  @OnEvent(EmailVerifiedEvent.EventName, { async: true })
  @OnEvent(EmailUnverifiedEvent.EventName, { async: true })
  @OnEvent(PasswordChangedEvent.EventName, { async: true })
  @OnEvent(PasswordResetEvent.EventName, { async: true })
  @OnEvent(UserLoggedInEvent.EventName, { async: true })
  @OnEvent(UserLoggedInWithOAuthEvent.EventName, { async: true })
  @OnEvent(AuthUserActivatedEvent.EventName, { async: true })
  @OnEvent(AuthUserDeactivatedEvent.EventName, { async: true })
  @OnEvent(AuthUserSuspendedEvent.EventName, { async: true })
  @OnEvent(AuthUserDeletedEvent.EventName, { async: true })
  @OnEvent(OAuthProviderLinkedEvent.EventName, { async: true })
  @OnEvent(OAuthProviderUnlinkedEvent.EventName, { async: true })
  */

  // ==================== USERS MODULE EVENTS ==================== //

  @OnEvent(UserUpdatedEvent.EventName, { async: true })
  /* DEPRECATED: No longer handle by specific events, but by general UserUpdatedEvent for any state change.
  @OnEvent(UserProfileUpdatedEvent.EventName, { async: true })
  @OnEvent(PhoneNumberUpdatedEvent.EventName, { async: true })
  @OnEvent(PhoneNumberVerifiedEvent.EventName, { async: true })
  @OnEvent(PhoneNumberUnverifiedEvent.EventName, { async: true })
  @OnEvent(AddressAddedEvent.EventName, { async: true })
  @OnEvent(AddressUpdatedEvent.EventName, { async: true })
  @OnEvent(AddressRemovedEvent.EventName, { async: true })
  @OnEvent(UserActivatedEvent.EventName, { async: true })
  @OnEvent(UserDeactivatedEvent.EventName, { async: true })
  @OnEvent(UserSuspendedEvent.EventName, { async: true })
  @OnEvent(UserUnsuspendedEvent.EventName, { async: true })
  @OnEvent(UserDeletedEvent.EventName, { async: true })
  @OnEvent(UserRestoredEvent.EventName, { async: true })
  */
  async handle(e: DomainEvent) {
    const payload = e.payload;
    // Extract userId and email from payload
    const userId: string = payload.userId;
    const email: string | undefined = payload.email;

    // Debugging
    this.logger.debug(`Received event ${e.name} for userId=${userId}, email=${email}`);
    this.logger.debug(`Invalidating cache for userId=${userId}, email=${email}`);
    this.logger.debug(`Event payload: ${JSON.stringify(payload)}`);

    // Use centralized service to invalidate ALL user-related caches
    // This ensures both Auth and Users module caches are invalidated
    await this.userCacheInvalidation.invalidateUserCache(userId, email);
  }
}
