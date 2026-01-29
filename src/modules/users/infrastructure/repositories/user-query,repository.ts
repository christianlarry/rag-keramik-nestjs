import { Injectable } from "@nestjs/common";
import {
  IUserQueryRepository,
  UserAuthDto,
  UserAuthWithPasswordDto,
  UserProfileDto,
  UserListItemDto,
  SearchOptions,
  PaginationOptions,
  UserSearchCriteria,
  PagedResult,
  UserCountOnSearchCriteria,
  User,
  OAuthUserData,
  EmailVerificationResult,
  UpdateUserParams,
  RemoveOptions,
} from "../../domain";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { UserRole } from "../../domain/types/user.type";
import { UserMapper } from "../mappers/user.mapper";
import { CacheService } from "src/infrastructure/cache/cache.service";
import { UserCacheKeys, UserCacheTTL } from "../cache";
import { UserOrderByWithAggregationInput, UserWhereInput } from "src/generated/prisma/models";

@Injectable()
export class UserQueryRepository implements IUserQueryRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService
  ) { }

  // =====================================================
  // List & Count Operations
  // =====================================================

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
        const pageSize = criteria.pageSize && criteria.pageSize > 0 ? criteria.pageSize : 20;
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

  // =====================================================
  // Command Operations (should ideally be in command repository)
  // =====================================================

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

  // =====================================================
  // Authentication Queries
  // =====================================================

  async getAuthDataById(id: string): Promise<UserAuthDto | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    return user ? {
      email: user.email,
      id: user.id,
      role: UserMapper.role.toEntity(user.role),
      status: UserMapper.status.toEntity(user.status),
      emailVerified: user.emailVerified,
    } : null;
  }

  async getAuthDataByEmail(email: string): Promise<UserAuthWithPasswordDto | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        password: true,
      },
    });

    return user ? {
      email: user.email,
      id: user.id,
      role: UserMapper.role.toEntity(user.role),
      status: UserMapper.status.toEntity(user.status),
      emailVerified: user.emailVerified,
      password: user.password,
    } : null;
  }

  // =====================================================
  // Display Projections
  // =====================================================

  async getProfile(id: string): Promise<UserProfileDto | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        phoneNumber: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return user ? {
      email: user.email,
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      role: UserMapper.role.toEntity(user.role),
      status: UserMapper.status.toEntity(user.status),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    } : null;
  }

  async getListItem(id: string): Promise<UserListItemDto | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return user ? {
      email: user.email,
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: UserMapper.role.toEntity(user.role),
      status: UserMapper.status.toEntity(user.status),
      createdAt: user.createdAt,
    } : null;
  }

  async getAvatarUrl(id: string): Promise<string | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        avatarUrl: true,
      },
    });

    return user?.avatarUrl ?? null;
  }

  async getDisplayName(id: string): Promise<string | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    if (!user) return null;

    const { firstName, lastName } = user;
    if (!firstName && !lastName) return null;

    return [firstName, lastName].filter(Boolean).join(' ');
  }

  // =====================================================
  // Batch Operations
  // =====================================================

  async getBatchByIds(ids: string[]): Promise<UserListItemDto[]> {
    const users = await this.prismaService.user.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(user => ({
      email: user.email,
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: UserMapper.role.toEntity(user.role),
      status: UserMapper.status.toEntity(user.status),
      createdAt: user.createdAt,
    }));
  }

  async getBatchAuthData(ids: string[]): Promise<Map<string, UserAuthDto>> {
    const users = await this.prismaService.user.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    const map = new Map<string, UserAuthDto>();
    users.forEach(user => {
      map.set(user.id, {
        email: user.email,
        id: user.id,
        role: UserMapper.role.toEntity(user.role),
        status: UserMapper.status.toEntity(user.status),
        emailVerified: user.emailVerified,
      });
    });

    return map;
  }

  // =====================================================
  // Existence & Validation Checks
  // =====================================================

  async exists(id: string): Promise<boolean> {
    const count = await this.prismaService.user.count({
      where: { id },
    });

    return count > 0;
  }

  async existsBatch(ids: string[]): Promise<Map<string, boolean>> {
    const users = await this.prismaService.user.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
      },
    });

    const existingIds = new Set(users.map(u => u.id));
    const map = new Map<string, boolean>();

    ids.forEach(id => {
      map.set(id, existingIds.has(id));
    });

    return map;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const count = await this.prismaService.user.count({
      where: { email },
    });

    return count > 0;
  }

  // =====================================================
  // Search and Filter
  // =====================================================

  async search(term: string, options?: SearchOptions): Promise<UserListItemDto[]> {
    const {
      page = 0,
      limit = 50,
      minLength = 2,
      maxResults = 50,
      includeInactive = false,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options || {};

    // Validate term length
    if (term.length < minLength) {
      return [];
    }

    const effectiveLimit = Math.min(limit, maxResults);

    const users = await this.prismaService.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { email: { contains: term, mode: 'insensitive' } },
              { firstName: { contains: term, mode: 'insensitive' } },
              { lastName: { contains: term, mode: 'insensitive' } },
            ],
          },
          includeInactive ? {} : { status: 'ACTIVE' },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: page * effectiveLimit,
      take: effectiveLimit,
    });

    return users.map(user => ({
      email: user.email,
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: UserMapper.role.toEntity(user.role),
      status: UserMapper.status.toEntity(user.status),
      createdAt: user.createdAt,
    }));
  }

  async getByRole(role: UserRole, options?: PaginationOptions): Promise<UserListItemDto[]> {
    const {
      page = 0,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options || {};

    const users = await this.prismaService.user.findMany({
      where: { role: UserMapper.role.toPrisma(role) },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: page * limit,
      take: limit,
    });

    return users.map(user => ({
      email: user.email,
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: UserMapper.role.toEntity(user.role),
      status: UserMapper.status.toEntity(user.status),
      createdAt: user.createdAt,
    }));
  }
}