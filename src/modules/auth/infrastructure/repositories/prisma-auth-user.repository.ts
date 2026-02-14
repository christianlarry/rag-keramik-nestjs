import { Injectable, Logger } from "@nestjs/common";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { PrismaAuthUserMapper } from "../mapper/prisma-auth-user.mapper";
import { CacheService } from "src/modules/cache/cache.service";
import { UserAuthCache } from "../cache/user-auth.cache";
import { PrismaClient } from "src/generated/prisma/client";
import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class PrismaAuthUserRepository implements AuthUserRepository {

  private readonly logger = new Logger(PrismaAuthUserRepository.name);
  private readonly client: PrismaClient | TransactionClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.client = this.prisma.getClient();
  }

  async findById(userId: string): Promise<AuthUser | null> {
    const cachedUser = await this.cache.wrap(
      UserAuthCache.getUserByIdKey(userId),
      async () => {
        const user = await this.client.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            fullName: true,
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
            deletedAt: true,
            authProviders: {
              select: {
                provider: true,
                providerId: true,
                linkedAt: true
              }
            }
          }
        });

        return user;
      },
      UserAuthCache.USER_CACHE_TTL
    )

    return cachedUser ? PrismaAuthUserMapper.toDomain(cachedUser) : null;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const cachedUser = await this.cache.wrap(
      UserAuthCache.getUserByEmailKey(email),
      async () => {

        const user = await this.client.user.findUnique({
          where: { email: email },
          select: {
            id: true,
            fullName: true,
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
            deletedAt: true,
            authProviders: {
              select: {
                provider: true,
                providerId: true,
                linkedAt: true
              }
            }
          }
        });

        return user;

      },
      UserAuthCache.USER_CACHE_TTL
    )

    return cachedUser ? PrismaAuthUserMapper.toDomain(cachedUser) : null;
  }

  async isEmailExisting(email: string): Promise<boolean> {
    const count = await this.client.user.count({
      where: { email: email }
    });
    return count > 0;
  }

  async save(authUser: AuthUser): Promise<void> {
    const { authProviders, ...persistenceUser } = PrismaAuthUserMapper.toPersistence(authUser);

    await this.client.user.upsert({
      where: { id: persistenceUser.id },
      create: {
        ...persistenceUser,
        authProviders: {
          createMany: {
            data: authProviders
          }
        }
      },
      update: {
        ...persistenceUser,
        authProviders: {
          createMany: {
            data: authProviders
          }
        }
      }
    });

    // Invalidate cache
    await Promise.all([
      this.cache.del(UserAuthCache.getUserByIdKey(persistenceUser.id)),
      this.cache.del(UserAuthCache.getUserByEmailKey(persistenceUser.email))
    ]);

    // Emit user saved events
    const events = authUser.pullDomainEvents();
    for (const event of events) {
      await this.eventEmitter.emitAsync(event.name, event);
    }
  }
}