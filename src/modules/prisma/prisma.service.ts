import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { AllConfigType } from "src/config/config.type";
import { PrismaClient } from "src/generated/prisma/client";
import { PrismaClientKnownRequestError, TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { PrismaErrorCode } from "./errors/prisma-error-code.enum";
import { prismaCls } from "./prisma.cls";

@Injectable()
export class PrismaService extends PrismaClient {

  private readonly logger = new Logger(PrismaService.name);

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    const DATABASE_URL = configService.getOrThrow('prisma.databaseUrl', { infer: true });

    const adapter = new PrismaPg({ connectionString: DATABASE_URL });

    super({ adapter });
  }

  get client(): PrismaClient | TransactionClient {

    this.logger.debug(`Getting Prisma client. In transaction: ${prismaCls.getStore() ? 'yes' : 'no'}`);

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