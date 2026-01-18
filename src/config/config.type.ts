import { PrismaConfig } from "src/modules/prisma/config/prisma-config.type";
import { MailConfig } from "src/modules/mail/config/mail-config.type";
import { AppConfig } from "./app/app-config.type";
import { RedisConfig } from "src/modules/redis/config/redis-config.type";
import { AuthConfig } from "src/modules/auth/config/auth-config.type";
import { RateLimitConfig } from "./rate-limit/rate-limit-config.type";

export type AllConfigType = {
  // Global Configuration
  app: AppConfig;

  // Infrastructure Configuration
  redis: RedisConfig;
  prisma: PrismaConfig;

  // Module Configuration
  mail: MailConfig;
  auth: AuthConfig;
  rateLimit: RateLimitConfig;
};