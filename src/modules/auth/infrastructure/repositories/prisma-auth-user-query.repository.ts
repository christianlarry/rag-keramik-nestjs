import { Injectable } from "@nestjs/common";
import { AuthUserQueryRepository, GetRequestedUserByIdResult } from "../../domain/repositories/auth-user-query-repository.inteface";
import { PrismaService } from "src/core/infrastructure/persistence/prisma/prisma.service";
import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { PrismaClient } from "src/generated/prisma/client";

@Injectable()
export class PrismaAuthUserQueryRepository implements AuthUserQueryRepository {

  private readonly client: PrismaClient | TransactionClient;

  constructor(
    private readonly prisma: PrismaService
  ) {
    this.client = this.prisma.getClient();
  }

  async getRequestedUserById(userId: string): Promise<GetRequestedUserByIdResult | null> {
    return this.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        refreshTokens: true,
      }
    })
  }
}