import { Injectable } from "@nestjs/common";
import { IUserRepository, User } from "../../domain";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { UserMapper } from "../mappers/user.mapper";
import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { CacheService } from "src/infrastructure/cache/cache.service";
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
    // If user has ID, perform update, otherwise create new user
    if (data.id) {
      const user = await this.prismaService.user.update({
        where: { id: data.id },
        data: {
          email: data.email,
          password: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender ? UserMapper.gender.toPrisma(data.gender) : undefined,
          emailVerified: data.emailVerified,
          emailVerifiedAt: data.emailVerifiedAt,
          provider: data.provider ? UserMapper.provider.toPrisma(data.provider) : undefined,
          providerId: data.providerId,
          role: data.role ? UserMapper.role.toPrisma(data.role) : undefined,
          status: data.status ? UserMapper.status.toPrisma(data.status) : undefined,
          phoneNumber: data.phoneNumber,
          avatarUrl: data.avatarUrl,
          dateOfBirth: data.dateOfBirth,
          lastLoginAt: data.lastLoginAt,
          passwordChangedAt: data.passwordChangedAt,
          refreshTokens: data.refreshTokens,

          addresses: data.addresses ? {
            deleteMany: {}, // Remove existing addresses
            create: data.addresses.map(addr => ({
              label: UserMapper.addressLabel.toPrisma(addr.label),
              city: addr.city,
              street: addr.street,
              postalCode: addr.postalCode,
              phone: addr.phone,
              country: addr.country,
              province: addr.province,
              recipient: addr.recipient,
              latitude: addr.latitude,
              longitude: addr.longitude,
              isDefault: addr.equals(data.getPrimaryAddress()!),
            })), // Add new addresses
          } : undefined,
        },
        include: {
          addresses: true,
        }
      });

      // Invalidate cache
      await this.cacheService.del(UserCacheKeys.byId(data.id));
      await this.cacheService.del(UserCacheKeys.byEmail(data.email));
      await this.cacheService.delPattern(UserCacheKeys.userPattern(data.id));
      await this.cacheService.del(UserCacheKeys.emailExists(data.email));
      await this.cacheService.delPattern(UserCacheKeys.listPattern);

      return UserMapper.toDomain(user);
    }

    // Create new user
    const user = await this.prismaService.user.create({
      data: {
        email: data.email,
        password: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: UserMapper.gender.toPrisma(data.gender),
        emailVerified: data.emailVerified ?? false,
        emailVerifiedAt: data.emailVerifiedAt,
        provider: data.provider ? UserMapper.provider.toPrisma(data.provider) : 'LOCAL',
        providerId: data.providerId,
        role: data.role ? UserMapper.role.toPrisma(data.role) : 'CUSTOMER',
        status: data.status ? UserMapper.status.toPrisma(data.status) : 'ACTIVE',
        phoneNumber: data.phoneNumber,
        avatarUrl: data.avatarUrl,
        dateOfBirth: data.dateOfBirth,
        lastLoginAt: data.lastLoginAt,
        passwordChangedAt: data.passwordChangedAt,
        refreshTokens: data.refreshTokens,
      },
      include: {
        addresses: true,
      }
    });

    // Invalidate cache
    await this.cacheService.delPattern(UserCacheKeys.listPattern);
    await this.cacheService.del(UserCacheKeys.emailExists(data.email));

    return UserMapper.toDomain(user);
  }
}