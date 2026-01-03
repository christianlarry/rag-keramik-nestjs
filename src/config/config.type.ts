import { PrismaConfig } from "src/modules/prisma/config/prisma-config.type";
import { AppConfig } from "./app-config.type";
import { MailConfig } from "src/modules/mail/config/mail-config.type";

export type AllConfigType = {
  app: AppConfig;
  prisma: PrismaConfig;
  mail: MailConfig;
};