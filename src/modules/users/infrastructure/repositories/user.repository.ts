import { Injectable } from "@nestjs/common";
import { IUserRepository, User } from "../../domain";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { UserMapper } from "../mappers/user.mapper";
import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { CacheService } from "src/modules/cache/cache.service";
import { UserCacheKeys, UserCacheTTL } from "../cache";

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    private readonly prismaService: PrismaService | TransactionClient,
    private readonly cacheService: CacheService
  ) { } // TransactionClient for transactional operations

  async findById(id: string): Promise<User | null> {
    const cacheKey = UserCacheKeys.byId(id);

    // Cache Aside Pattern
    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const user = await this.prismaService.user.findUnique({
          where: { id },
          include: {
            addresses: true,
          }
        });

        return user ? UserMapper.toDomain(user) : null;
      },
      UserCacheTTL.USER_DETAIL
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = UserCacheKeys.byEmail(email);

    // Cache Aside Pattern
    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const user = await this.prismaService.user.findUnique({
          where: { email },
          include: {
            addresses: true,
          }
        });

        return user ? UserMapper.toDomain(user) : null;
      },
      UserCacheTTL.USER_DETAIL
    );
  }

  async existsByEmail(email: string): Promise<boolean> {
    const cacheKey = UserCacheKeys.emailExists(email);

    // Cache Aside Pattern
    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const count = await this.prismaService.user.count({
          where: { email },
        });

        return count > 0;
      },
      UserCacheTTL.EMAIL_EXISTS
    );
  }

  async save(data: User): Promise<User> {
    const user = await this.prismaService.user.create({
      data: {
        email: data.email,
        password: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: UserMapper.gender.toPrisma(data.gender),
        emailVerified: data.emailVerified ?? false,
        provider: data.provider ? UserMapper.provider.toPrisma(data.provider) : 'LOCAL',
        providerId: data.providerId,
        role: data.role ? UserMapper.role.toPrisma(data.role) : 'CUSTOMER',
        status: data.status ? UserMapper.status.toPrisma(data.status) : 'ACTIVE',
      },
      include: {
        addresses: true,
      }
    });

    return UserMapper.toDomain(user);
  }
}