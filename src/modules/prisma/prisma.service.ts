import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { AllConfigType } from "src/config/config.type";
import { PrismaClient } from "src/generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    const DATABASE_URL = configService.getOrThrow('prisma.databaseUrl', { infer: true });

    const adapter = new PrismaPg({ connectionString: DATABASE_URL });

    super({ adapter });
  }
}