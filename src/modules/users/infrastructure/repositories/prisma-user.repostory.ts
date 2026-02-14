import { Injectable, Logger } from "@nestjs/common";
import { User } from "../../domain/entities/user.entity";
import { type UserRepository } from "../../domain/repositories/user-repository.interface";
import { PrismaService } from "src/core/infrastructure/persistence/prisma/prisma.service";
import { PrismaUserMapper } from "../mappers/prisma-user.mapper";
import { UserCache } from "../cache/user.cache";
import { PrismaClient } from "src/generated/prisma/client";
import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CacheService } from "src/core/infrastructure/services/cache/cache.service";

@Injectable()
export class PrismaUserRepository implements UserRepository {

  private readonly logger = new Logger(PrismaUserRepository.name);
  private readonly client: PrismaClient | TransactionClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.client = this.prisma.getClient();
  }

  async findById(id: string): Promise<User | null> {
    const cachedUser = await this.cache.wrap(
      UserCache.getUserByIdKey(id),
      async () => {
        const user = await this.client.user.findUnique({
          where: { id: id },
          select: {
            id: true,
            fullName: true,
            email: true,
            dateOfBirth: true,
            gender: true,
            avatarUrl: true,
            phoneNumber: true,
            phoneVerified: true,
            phoneVerifiedAt: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            addresses: {
              select: {
                id: true,
                label: true,
                recipient: true,
                phone: true,
                street: true,
                city: true,
                province: true,
                postalCode: true,
                country: true,
                latitude: true,
                longitude: true,
                isDefault: true,
              }
            }
          }
        });

        return user;
      },
      UserCache.USER_DETAIL_TTL
    );

    return cachedUser ? PrismaUserMapper.toDomain(cachedUser) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const cachedUser = await this.cache.wrap(
      UserCache.getUserByEmailKey(email),
      async () => {
        const user = await this.client.user.findUnique({
          where: { email: email },
          select: {
            id: true,
            fullName: true,
            email: true,
            dateOfBirth: true,
            gender: true,
            avatarUrl: true,
            phoneNumber: true,
            phoneVerified: true,
            phoneVerifiedAt: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            addresses: {
              select: {
                id: true,
                label: true,
                recipient: true,
                phone: true,
                street: true,
                city: true,
                province: true,
                postalCode: true,
                country: true,
                latitude: true,
                longitude: true,
                isDefault: true,
              }
            }
          }
        });

        return user;
      },
      UserCache.USER_DETAIL_TTL
    );

    return cachedUser ? PrismaUserMapper.toDomain(cachedUser) : null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const cachedUser = await this.cache.wrap(
      UserCache.getUserByPhoneKey(phoneNumber),
      async () => {
        const user = await this.client.user.findFirst({
          where: { phoneNumber: phoneNumber },
          select: {
            id: true,
            fullName: true,
            email: true,
            dateOfBirth: true,
            gender: true,
            avatarUrl: true,
            phoneNumber: true,
            phoneVerified: true,
            phoneVerifiedAt: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            addresses: {
              select: {
                id: true,
                label: true,
                recipient: true,
                phone: true,
                street: true,
                city: true,
                province: true,
                postalCode: true,
                country: true,
                latitude: true,
                longitude: true,
                isDefault: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          }
        });

        return user;
      },
      UserCache.USER_DETAIL_TTL
    );

    return cachedUser ? PrismaUserMapper.toDomain(cachedUser) : null;
  }

  async save(user: User): Promise<void> {
    const { addresses, ...persistenceUser } = PrismaUserMapper.toPersistence(user);
    const userId = persistenceUser.id;

    await this.client.user.upsert({
      where: { id: userId },
      create: {
        ...persistenceUser,
        addresses: {
          createMany: {
            data: addresses
          }
        }
      },
      update: {
        ...persistenceUser,
        addresses: {
          deleteMany: {}, // Remove existing addresses to handle updates, then re-create
          createMany: {
            data: addresses
          }
        }
      }
    });

    // Invalidate cache
    const invalidationKeys = UserCache.getInvalidationKeys(
      userId,
      persistenceUser.email,
      persistenceUser.phoneNumber || undefined
    );

    await Promise.all(
      invalidationKeys.map(key => this.cache.del(key))
    );

    const events = user.pullDomainEvents();
    for (const event of events) {
      await this.eventEmitter.emitAsync(event.name, event);
    }
  }

  async delete(id: string): Promise<void> {
    await this.client.user.delete({
      where: { id: id }
    });

    // Invalidate cache
    await this.cache.del(UserCache.getUserByIdKey(id));

    this.logger.log(`User with ID ${id} has been deleted`);
  }
}
