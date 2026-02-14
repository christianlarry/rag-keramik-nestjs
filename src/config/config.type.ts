import { PrismaConfig } from "src/core/infrastructure/persistence/prisma/config/prisma-config.type";
import { MailConfig } from "src/core/infrastructure/services/mail/config/mail-config.type";
import { AppConfig } from "./app/app-config.type";
import { RedisConfig } from "src/core/infrastructure/persistence/redis/config/redis-config.type";
import { AuthConfig } from "src/modules/auth/infrastructure/config/types/auth-config.type";
import { RateLimitConfig } from "./rate-limit/rate-limit-config.type";
import { AuthFacebookConfig } from "src/modules/auth/infrastructure/config/types/auth-facebook.config.type";
import { AuthGoogleConfig } from "src/modules/auth/infrastructure/config/types/auth-google-config.type";

export type AllConfigType = {
  // Global Configuration
  app: AppConfig;

  // Infrastructure Configuration
  redis: RedisConfig;
  prisma: PrismaConfig;

  // Module Configuration
  mail: MailConfig;
  auth: AuthConfig;
  authGoogle: AuthGoogleConfig;
  authFacebook: AuthFacebookConfig;
  rateLimit: RateLimitConfig;
};