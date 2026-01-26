import { Injectable } from "@nestjs/common";
import { CreateUserParams, EmailVerificationResult, IUserRepository, OAuthUserData, PagedResult, RemoveOptions, UpdateUserParams, UserEntity, UserSearchCriteria } from "../../domain";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { UserMapper } from "../mappers/user.mapper";
import { UserOrderByWithAggregationInput, UserWhereInput } from "src/generated/prisma/models";
import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prismaService: PrismaService | TransactionClient) { } // TransactionClient for transactional operations

  async findMany(criteria: UserSearchCriteria): Promise<PagedResult<UserEntity>> {

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
      await this.prismaService.user.count({ where: whereClause }),
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
  }

  async count(criteria?: Partial<UserSearchCriteria>): Promise<number> {
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
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    return user ? UserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    return user ? UserMapper.toDomain(user) : null;
  }

  async save(data: CreateUserParams): Promise<UserEntity> {
    const user = await this.prismaService.user.create({
      data: {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        emailVerified: data.emailVerified ?? false,
        provider: data.provider ?? 'LOCAL',
        providerId: data.providerId,
        role: data.role ?? 'CUSTOMER',
        status: data.status ?? 'ACTIVE',
        addresses: data.address ? {
          create: {
            label: data.address.label,
            recipient: data.address.recipient,
            phone: data.address.phone,
            street: data.address.street,
            city: data.address.city,
            province: data.address.province,
            postalCode: data.address.postalCode,
            country: data.address.country ?? 'Indonesia',
            latitude: data.address.latitude,
            longitude: data.address.longitude,
            isDefault: data.address.isDefault ?? false,
          }
        } : undefined,
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

  async updateById(id: string, data: UpdateUserParams): Promise<UserEntity> {
    const user = await this.prismaService.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        gender: data.gender,
        emailVerified: data.emailVerified,
        provider: data.provider,
        providerId: data.providerId,
        role: data.role,
        status: data.status,
      },
    });

    return UserMapper.toDomain(user);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prismaService.user.count({
      where: { email },
    });

    return count > 0;
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

  async upsertOAuthUser(data: OAuthUserData): Promise<UserEntity> {

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