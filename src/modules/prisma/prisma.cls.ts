import { AsyncLocalStorage } from "async_hooks";
import { PrismaClient } from "src/generated/prisma/client";
import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";

export const prismaCls = new AsyncLocalStorage<PrismaClient | TransactionClient>();