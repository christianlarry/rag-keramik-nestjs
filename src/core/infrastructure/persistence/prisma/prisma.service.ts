import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { AllConfigType } from "src/config/config.type";
import { PrismaClient } from "src/generated/prisma/client";
import { PrismaClientKnownRequestError, TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { PrismaErrorCode } from "./errors/prisma-error-code.enum";
import { prismaCls } from "./prisma.cls";

@Injectable()
export class PrismaService extends PrismaClient {

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    const DATABASE_URL = configService.getOrThrow('prisma.databaseUrl', { infer: true });

    const adapter = new PrismaPg({ connectionString: DATABASE_URL });

    super({ adapter });
  }

  getClient(): PrismaClient | TransactionClient {
    return prismaCls.getStore() ?? this;
  }

  isPrismaUniqueError(err: unknown, fieldName?: string): boolean {
    return (
      err instanceof PrismaClientKnownRequestError &&
      err.code === PrismaErrorCode.UNIQUE_CONSTRAINT_VIOLATION &&
      (fieldName ? (err.meta?.target as string[])?.includes(fieldName) : true)
    )
  }

  isPrismaRecordNotFoundError(err: unknown): boolean {
    return (
      err instanceof PrismaClientKnownRequestError &&
      err.code === PrismaErrorCode.RECORD_NOT_FOUND
    )
  }
}