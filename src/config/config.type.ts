import { PrismaConfig } from "src/modules/prisma/config/prisma-config.type";
import { MailConfig } from "src/modules/mail/config/mail-config.type";
import { RedisConfig } from "./redis/redis-config.type";
import { AppConfig } from "./app/app-config.type";

export type AllConfigType = {
  // Global Configuration
  app: AppConfig;

  // Infrastructure Configuration
  redis: RedisConfig;
  prisma: PrismaConfig;

  // Module Configuration
  mail: MailConfig;
};