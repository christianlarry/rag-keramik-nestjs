import { Injectable } from "@nestjs/common";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { PrismaAuthUserMapper } from "../mapper/prisma-auth-user.mapper";
import { CacheService } from "src/modules/cache/cache.service";
import { UserAuthCache } from "../cache/user-auth.cache";

@Injectable()
export class PrismaAuthUserRepository implements AuthUserRepository {

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) { }

  async findById(userId: string): Promise<AuthUser | null> {
    return this.cache.wrap(
      UserAuthCache.getUserByIdKey(userId),
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            emailVerifiedAt: true,
            password: true,
            role: true,
            status: true,
            refreshTokens: true,
            lastLoginAt: true,
            loginAttempts: true,
            createdAt: true,
            updatedAt: true,
            provider: true,
            providerId: true
          }
        });

        return user ? PrismaAuthUserMapper.toDomain(user) : null;
      },
      UserAuthCache.USER_CACHE_TTL
    )
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    return this.cache.wrap(
      UserAuthCache.getUserByEmailKey(email),
      async () => {

        const user = await this.prisma.user.findUnique({
          where: { email: email },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            emailVerifiedAt: true,
            password: true,
            role: true,
            status: true,
            refreshTokens: true,
            lastLoginAt: true,
            loginAttempts: true,
            createdAt: true,
            updatedAt: true,
            provider: true,
            providerId: true
          }
        });

        return user ? PrismaAuthUserMapper.toDomain(user) : null;

      },
      UserAuthCache.USER_CACHE_TTL
    )
  }

  async isEmailExisting(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email }
    });
    return count > 0;
  }

  async save(user: AuthUser): Promise<void> {
    const persistenceUser = PrismaAuthUserMapper.toPersistence(user);

    await this.prisma.user.upsert({
      where: { id: persistenceUser.id },
      create: persistenceUser,
      update: persistenceUser
    });

    // Invalidate cache
    await Promise.all([
      this.cache.del(UserAuthCache.getUserByIdKey(persistenceUser.id)),
      this.cache.del(UserAuthCache.getUserByEmailKey(persistenceUser.email))
    ]);
  }
}