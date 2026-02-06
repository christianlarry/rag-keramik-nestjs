import { AsyncLocalStorage } from "async_hooks";
import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";

export const prismaCls = new AsyncLocalStorage<TransactionClient>();