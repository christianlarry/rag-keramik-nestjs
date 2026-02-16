import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { DomainEvent } from "src/core/domain/domain-event.base";
import { UserCacheInvalidationService } from "../services/user-cache-invalidation.service";

// Auth Module Events
import { EmailUnverifiedEvent } from "src/modules/auth/domain/events/email-unverified.event";
import { EmailVerifiedEvent } from "src/modules/auth/domain/events/email-verified.event";
import { OAuthProviderLinkedEvent } from "src/modules/auth/domain/events/oauth-provider-linked.event";
import { OAuthProviderUnlinkedEvent } from "src/modules/auth/domain/events/oauth-provider-unlinked.event";
import { PasswordChangedEvent } from "src/modules/auth/domain/events/password-changed.event";
import { PasswordResetEvent } from "src/modules/auth/domain/events/password-reset.event";
import { UserActivatedEvent as AuthUserActivatedEvent } from "src/modules/auth/domain/events/user-activated.event";
import { UserCreatedFromOAuthEvent } from "src/modules/auth/domain/events/user-created-from-oauth.event";
import { UserDeactivatedEvent as AuthUserDeactivatedEvent } from "src/modules/auth/domain/events/user-deactivated.event";
import { UserDeletedEvent as AuthUserDeletedEvent } from "src/modules/auth/domain/events/user-deleted.event";
import { UserLoggedInWithOAuthEvent } from "src/modules/auth/domain/events/user-logged-in-with-oauth.event";
import { UserLoggedInEvent } from "src/modules/auth/domain/events/user-logged-in.event";
import { UserRegisteredEvent } from "src/modules/auth/domain/events/user-registered.event";
import { UserSuspendedEvent as AuthUserSuspendedEvent } from "src/modules/auth/domain/events/user-suspended.event";

// Users Module Events
import { UserProfileUpdatedEvent } from "src/modules/users/domain/events/user-profile-updated.event";
import { PhoneNumberUpdatedEvent } from "src/modules/users/domain/events/phone-number-updated.event";
import { PhoneNumberVerifiedEvent } from "src/modules/users/domain/events/phone-number-verified.event";
import { PhoneNumberUnverifiedEvent } from "src/modules/users/domain/events/phone-number-unverified.event";
import { AddressAddedEvent } from "src/modules/users/domain/events/address-added.event";
import { AddressUpdatedEvent } from "src/modules/users/domain/events/address-updated.event";
import { AddressRemovedEvent } from "src/modules/users/domain/events/address-removed.event";
import { UserActivatedEvent } from "src/modules/users/domain/events/user-activated.event";
import { UserDeactivatedEvent } from "src/modules/users/domain/events/user-deactivated.event";
import { UserSuspendedEvent } from "src/modules/users/domain/events/user-suspended.event";
import { UserUnsuspendedEvent } from "src/modules/users/domain/events/user-unsuspended.event";
import { UserDeletedEvent } from "src/modules/users/domain/events/user-deleted.event";
import { UserRestoredEvent } from "src/modules/users/domain/events/user-restored.event";

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
  @OnEvent(UserCreatedFromOAuthEvent.EventName, { async: true })

  // ==================== USERS MODULE EVENTS ==================== //

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
  async handle(e: DomainEvent) {
    const payload = e.payload;
    // Extract userId and email from payload
    const userId: string = payload.userId;
    const email: string | undefined = payload.email;

    // Use centralized service to invalidate ALL user-related caches
    // This ensures both Auth and Users module caches are invalidated
    await this.userCacheInvalidation.invalidateUserCache(userId, email);
  }
}
