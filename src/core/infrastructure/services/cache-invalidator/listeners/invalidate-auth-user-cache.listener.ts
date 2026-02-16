import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { DomainEvent } from "src/core/domain/domain-event.base";
import { CacheService } from "src/core/infrastructure/services/cache/cache.service";
import { EmailUnverifiedEvent } from "src/modules/auth/domain/events/email-unverified.event";
import { EmailVerifiedEvent } from "src/modules/auth/domain/events/email-verified.event";
import { OAuthProviderLinkedEvent } from "src/modules/auth/domain/events/oauth-provider-linked.event";
import { OAuthProviderUnlinkedEvent } from "src/modules/auth/domain/events/oauth-provider-unlinked.event";
import { PasswordChangedEvent } from "src/modules/auth/domain/events/password-changed.event";
import { PasswordResetEvent } from "src/modules/auth/domain/events/password-reset.event";
import { UserActivatedEvent } from "src/modules/auth/domain/events/user-activated.event";
import { UserCreatedFromOAuthEvent } from "src/modules/auth/domain/events/user-created-from-oauth.event";
import { UserDeactivatedEvent } from "src/modules/auth/domain/events/user-deactivated.event";
import { UserDeletedEvent } from "src/modules/auth/domain/events/user-deleted.event";
import { UserLoggedInWithOAuthEvent } from "src/modules/auth/domain/events/user-logged-in-with-oauth.event";
import { UserLoggedInEvent } from "src/modules/auth/domain/events/user-logged-in.event";
import { UserRegisteredEvent } from "src/modules/auth/domain/events/user-registered.event";
import { UserSuspendedEvent } from "src/modules/auth/domain/events/user-suspended.event";
import { UserAuthCache } from "src/modules/auth/infrastructure/cache/user-auth.cache";

@Injectable()
export class InvalidateAuthUserCacheListener {
  constructor(
    private readonly cache: CacheService
  ) { }

  @OnEvent(UserRegisteredEvent.EventName, { async: true })
  @OnEvent(EmailVerifiedEvent.EventName, { async: true })
  @OnEvent(EmailUnverifiedEvent.EventName, { async: true })
  @OnEvent(PasswordChangedEvent.EventName, { async: true })
  @OnEvent(PasswordResetEvent.EventName, { async: true })
  @OnEvent(UserLoggedInEvent.EventName, { async: true })
  @OnEvent(UserLoggedInWithOAuthEvent.EventName, { async: true })
  @OnEvent(UserActivatedEvent.EventName, { async: true })
  @OnEvent(UserDeactivatedEvent.EventName, { async: true })
  @OnEvent(UserSuspendedEvent.EventName, { async: true })
  @OnEvent(UserDeletedEvent.EventName, { async: true })
  @OnEvent(OAuthProviderLinkedEvent.EventName, { async: true })
  @OnEvent(OAuthProviderUnlinkedEvent.EventName, { async: true })
  @OnEvent(UserCreatedFromOAuthEvent.EventName, { async: true })
  async handle(e: DomainEvent) {
    const payload = e.payload;

    const userId: string | null = payload.userId || null;
    const email: string | null = payload.email || null;

    // Invalidate all relevant cache keys for the user
    const exact = [
      userId ? UserAuthCache.getUserByIdKey(userId) : null,
      email ? UserAuthCache.getUserByEmailKey(email) : null,
      userId ? UserAuthCache.getRequestedUserByIdKey(userId) : null,
    ].filter(Boolean) as string[];

    await Promise.all(exact.map(key => this.cache.del(key)));
  }
}