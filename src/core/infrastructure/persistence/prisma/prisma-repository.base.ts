import { PrismaClient } from "@prisma/client/extension";
import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { PrismaService } from "./prisma.service";

export abstract class PrismaRepositoryBase {
  protected client: PrismaClient | TransactionClient;

  constructor(
    private readonly prisma: PrismaService
  ) {
    this.client = prisma.getClient();
  }
}