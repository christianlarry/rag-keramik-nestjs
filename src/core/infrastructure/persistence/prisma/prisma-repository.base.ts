import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { PrismaService } from "./prisma.service";
import { PrismaClient } from "src/generated/prisma/client";

export abstract class PrismaRepositoryBase {
  protected client: PrismaClient | TransactionClient;

  constructor(
    private readonly prisma: PrismaService
  ) {
    this.client = prisma.getClient();
  }
}