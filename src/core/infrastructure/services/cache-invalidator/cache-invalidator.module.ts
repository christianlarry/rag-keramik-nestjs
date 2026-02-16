import { Module } from "@nestjs/common";
import { InvalidateAuthUserCacheListener } from "./listeners/invalidate-auth-user-cache.listener";

@Module({
  providers: [
    // Listeners
    InvalidateAuthUserCacheListener
  ],
})
export class CacheInvalidatorModule { }