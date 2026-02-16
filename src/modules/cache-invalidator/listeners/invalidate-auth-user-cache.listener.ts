import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { CacheService } from "src/core/infrastructure/services/cache/cache.service";
import { AuthUserUpdatedEvent } from "src/modules/auth/domain/events/auth-user-updated.event";
import { UserAuthCache } from "src/modules/auth/infrastructure/cache/user-auth.cache";
import { UserUpdatedEvent } from "src/modules/users/domain/events/user-updated.event";

@Injectable()
export class InvalidateAuthUserCacheListener {
  constructor(
    private readonly cache: CacheService
  ) { }

  @OnEvent(AuthUserUpdatedEvent.EventName, { async: true })
  async handleAuthUserUpdated(e: AuthUserUpdatedEvent) {
    const payload = e.payload;

    await this.invalidateUserCache(payload.userId, payload.email);
  }

  @OnEvent(UserUpdatedEvent.EventName, { async: true })
  async handleUserUpdated(e: UserUpdatedEvent) {
    const payload = e.payload;

    await this.invalidateUserCache(payload.userId, payload.email);
  }

  async invalidateUserCache(userId: string, email: string) {
    await Promise.all([
      this.cache.del(UserAuthCache.getUserByIdKey(userId)),
      this.cache.del(UserAuthCache.getUserByEmailKey(email)),
      this.cache.del(UserAuthCache.getRequestedUserByIdKey(userId)),
    ]);
  }
}