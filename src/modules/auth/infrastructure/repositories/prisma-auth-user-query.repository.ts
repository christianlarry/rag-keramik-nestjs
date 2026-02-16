import { Injectable } from "@nestjs/common";
import { AuthUserQueryRepository, GetRequestedUserByIdResult } from "../../domain/repositories/auth-user-query-repository.inteface";
import { PrismaService } from "src/core/infrastructure/persistence/prisma/prisma.service";
import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { PrismaClient, Role } from "src/generated/prisma/client";
import { roleMapper } from "../mapper/prisma-auth-user.mapper";
import { CacheService } from "src/core/infrastructure/services/cache/cache.service";
import { UserAuthCache } from "../cache/user-auth.cache";

@Injectable()
export class PrismaAuthUserQueryRepository implements AuthUserQueryRepository {

  private readonly client: PrismaClient | TransactionClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {
    this.client = this.prisma.getClient();
  }

  async getRequestedUserById(userId: string): Promise<GetRequestedUserByIdResult | null> {

    const cacheKey = UserAuthCache.getRequestedUserByIdKey(userId);

    const result = await this.cache.wrap(
      cacheKey,
      async () => {
        return await this.client.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            refreshTokens: true,
          }
        })
      },
      UserAuthCache.USER_CACHE_TTL
    )


    return result ? {
      id: result.id,
      fullName: result.fullName,
      email: result.email,
      role: roleMapper.toEntity(result.role) as Role,
      refreshTokens: result.refreshTokens,
    } : null;
  }
}