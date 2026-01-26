import { Injectable } from "@nestjs/common";
import { CreateUserParams, EmailVerificationResult, IUserRepository, OAuthUserData, PagedResult, RemoveOptions, UpdateUserParams, UserCountOnSearchCriteria, User, UserSearchCriteria } from "../../domain";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { UserMapper } from "../mappers/user.mapper";
import { UserOrderByWithAggregationInput, UserWhereInput } from "src/generated/prisma/models";
import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { CacheService } from "src/modules/cache/cache.service";
import { UserCacheKeys, UserCacheTTL } from "../cache";

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    private readonly prismaService: PrismaService | TransactionClient,
    private readonly cacheService: CacheService
  ) { } // TransactionClient for transactional operations

  async findMany(criteria: UserSearchCriteria): Promise<PagedResult<User>> {

    const cacheKey = UserCacheKeys.list(criteria);

    // Cache Aside Pattern
    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const whereClause: UserWhereInput = {
          role: UserMapper.role.toPrismaSafe(criteria.role),
          status: UserMapper.status.toPrismaSafe(criteria.status),
          emailVerified: criteria.emailVerified,
          provider: UserMapper.provider.toPrismaSafe(criteria.provider),

          OR: criteria.searchTerm ? [
            { firstName: { contains: criteria.searchTerm, mode: 'insensitive' } },
            { lastName: { contains: criteria.searchTerm, mode: 'insensitive' } },
            { email: { contains: criteria.searchTerm, mode: 'insensitive' } },
          ] : undefined,

          createdAt: {
            gte: criteria.createdAfter,
            lte: criteria.createdBefore,
          },
        }

        const orderByClause: UserOrderByWithAggregationInput = criteria.sortBy ? {
          [criteria.sortBy]: criteria.sortOrder || 'asc',
        } : { createdAt: 'asc' };

        const page = criteria.page && criteria.page > 0 ? criteria.page : 1;
        const pageSize = criteria.pageSize && criteria.pageSize > 0 ? criteria.pageSize : 20; // Same as limit
        const skip = (page - 1) * pageSize;

        const [users, count] = await Promise.all([
          await this.prismaService.user.findMany({
            where: whereClause,
            orderBy: orderByClause,
            skip,
            take: pageSize,
          }),
          await this.count(criteria),
        ]);

        return {
          items: UserMapper.toArrayDomain(users),
          pagination: {
            currentPage: criteria.page || 1,
            pageSize: criteria.pageSize || count,
            totalItems: count,
            totalPages: criteria.pageSize ? Math.ceil(count / criteria.pageSize) : 1,
            hasNext: criteria.page && criteria.pageSize ? (criteria.page * criteria.pageSize) < count : false,
            hasPrevious: criteria.page && criteria.page > 1 ? true : false,
          }
        };
      },
      UserCacheTTL.USER_LIST
    )
  }

  async count(criteria?: UserCountOnSearchCriteria): Promise<number> {

    const cacheKey = UserCacheKeys.count(criteria);

    // Cache Aside Pattern
    return this.cacheService.wrap(
      cacheKey,
      async () => {
        if (!criteria) {
          return this.prismaService.user.count();
        }

        const whereClause: UserWhereInput = {
          role: UserMapper.role.toPrismaSafe(criteria.role),
          status: UserMapper.status.toPrismaSafe(criteria.status),
          emailVerified: criteria.emailVerified,
          provider: UserMapper.provider.toPrismaSafe(criteria.provider),

          OR: criteria.searchTerm ? [
            { firstName: { contains: criteria.searchTerm, mode: 'insensitive' } },
            { lastName: { contains: criteria.searchTerm, mode: 'insensitive' } },
            { email: { contains: criteria.searchTerm, mode: 'insensitive' } },
          ] : undefined,

          createdAt: {
            gte: criteria.createdAfter,
            lte: criteria.createdBefore,
          },
        };

        return this.prismaService.user.count({ where: whereClause });
      },
      UserCacheTTL.COUNT
    );
  }

  async findById(id: string): Promise<User | null> {
    const cacheKey = UserCacheKeys.byId(id);

    // Cache Aside Pattern
    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const user = await this.prismaService.user.findUnique({
          where: { id },
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

  async save(data: CreateUserParams): Promise<User> {
    const user = await this.prismaService.user.create({
      data: {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: UserMapper.gender.toPrisma(data.gender),
        emailVerified: data.emailVerified ?? false,
        provider: data.provider ? UserMapper.provider.toPrisma(data.provider) : 'LOCAL',
        providerId: data.providerId,
        role: data.role ? UserMapper.role.toPrisma(data.role) : 'CUSTOMER',
        status: data.status ? UserMapper.status.toPrisma(data.status) : 'ACTIVE',
      },
    });

    return UserMapper.toDomain(user);
  }

  async remove(id: string, options?: RemoveOptions): Promise<void> {
    if (options?.hard) {
      // Hard delete - permanently remove from database
      await this.prismaService.user.delete({
        where: { id },
      });
    } else {
      // Soft delete - mark as deleted
      await this.prismaService.user.update({
        where: { id },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
        },
      });
    }
  }

  async updateById(id: string, data: UpdateUserParams): Promise<User> {
    const user = await this.prismaService.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        gender: data.gender ? UserMapper.gender.toPrisma(data.gender) : undefined,
        emailVerified: data.emailVerified,
        provider: data.provider ? UserMapper.provider.toPrisma(data.provider) : undefined,
        providerId: data.providerId,
        role: data.role ? UserMapper.role.toPrisma(data.role) : undefined,
        status: data.status ? UserMapper.status.toPrisma(data.status) : undefined,
      },
    });

    return UserMapper.toDomain(user);
  }

  async confirmEmail(id: string): Promise<EmailVerificationResult> {
    const now = new Date();
    const user = await this.prismaService.user.update({
      where: { id },
      data: {
        emailVerified: true,
        emailVerifiedAt: now,
        status: 'ACTIVE',
      },
    });

    return {
      userId: user.id,
      email: user.email,
      verifiedAt: now,
      status: user.status,
    };
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });
  }

  async revokeAllRefreshTokens(id: string): Promise<void> {

    await this.prismaService.user.update({
      where: { id },
      data: {
        refreshTokens: [],
      },
    });
  }

  async upsertOAuthUser(data: OAuthUserData): Promise<User> {

    // Split display name into first and last name
    const nameParts = data.displayName.split(' ');
    const firstName = nameParts[0] || data.displayName;
    const lastName = nameParts.slice(1).join(' ') || '';

    const user = await this.prismaService.user.upsert({
      where: { email: data.email },
      update: {
        providerId: data.providerId,
        avatarUrl: data.avatarUrl,
        emailVerified: data.emailVerified ?? true,
        emailVerifiedAt: data.emailVerified ? new Date() : null,
        lastLoginAt: new Date(),
      },
      create: {
        email: data.email,
        provider: data.provider as any,
        providerId: data.providerId,
        firstName,
        lastName,
        avatarUrl: data.avatarUrl,
        emailVerified: data.emailVerified ?? true,
        emailVerifiedAt: data.emailVerified ? new Date() : null,
        gender: 'MALE', // Default value, can be updated later
        role: 'CUSTOMER',
        status: 'ACTIVE',
        lastLoginAt: new Date(),
      },
    });

    return UserMapper.toDomain(user);
  }
}