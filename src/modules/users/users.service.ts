import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider, Role, UserStatus } from 'src/generated/prisma/enums';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { AllConfigType } from 'src/config/config.type';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/generated/prisma/client';
import { UserNotFoundError } from './errors';
import { UserEmailAlreadyExistsError } from './errors';
import { CacheService } from '../cache/cache.service';
import { UserCacheKeys, UserCacheTTL } from './cache';
import { UpdateUserParams } from './types/update-user-params.type';
import { CreateUserParams } from './types/create-user-params.type';

@Injectable()
export class UsersService {

  private readonly logger = new Logger(UsersService.name);

  // Inject PrismaService (tidak perlu import PrismaModule karena @Global)
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly cacheService: CacheService,
  ) { }

  /**
   * Find user by ID
   * @throws UserNotFoundError if user not found
   */
  async findById(id: string) {
    // Cache-aside pattern with 5 minutes TTL
    const cacheKey = UserCacheKeys.byId(id);

    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const user = await this.prismaService.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            emailVerifiedAt: true,
            password: true,
            firstName: true,
            lastName: true,
            gender: true,
            role: true,
            provider: true,
            providerId: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            refreshTokens: true,

            // password tidak di-return untuk security
          },
        });

        if (!user) {
          throw new UserNotFoundError({ field: 'id', value: id });
        }

        return user;
      },
      UserCacheTTL.USER_DETAIL,
    );
  }

  /**
   * Find user by email (untuk authentication)
   * @throws UserNotFoundError if user not found
   */
  async findByEmail(email: string) {
    // Cache-aside pattern with 5 minutes TTL
    const cacheKey = UserCacheKeys.byEmail(email);

    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const user = await this.prismaService.user.findUnique({
          where: { email },
          // Include password untuk verification
        });

        if (!user) {
          throw new UserNotFoundError({ field: 'email', value: email });
        }

        return user;
      },
      UserCacheTTL.USER_DETAIL,
    );
  }

  /**
   * Get all users with pagination (Admin only)
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    role?: Role;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    // Cache-aside pattern with 2 minutes TTL
    const cacheKey = UserCacheKeys.list({
      page,
      limit,
      role: params.role,
      search: params.search,
    });

    return this.cacheService.wrap(
      cacheKey,
      async () => {
        const where: any = {};

        if (params.role) {
          where.role = params.role;
        }

        if (params.search) {
          where.OR = [
            { name: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
          ];
        }

        const [users, total] = await Promise.all([
          this.prismaService.user.findMany({
            where,
            skip,
            take: limit,
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              provider: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
          this.prismaService.user.count({ where }),
        ]);

        return {
          data: users,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
          },
        };
      },
      UserCacheTTL.USER_LIST,
    );
  }

  /**
   * Update user profile
   * @throws UserNotFoundError jika user tidak ditemukan
   * @throws UserAlreadyExistsError jika email sudah terdaftar
   */
  async update(id: string, data: UpdateUserParams) {
    try {
      const user = await this.prismaService.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          updatedAt: true,
        },
      });

      // Invalidate cache for updated user
      // TODO : Bisa dioptimasi dengan cache tags nanti
      // TODO : Event Driven cache invalidation dengan Outbox / Message Queue (BullMQ)
      await this.cacheService.del(UserCacheKeys.byId(id));
      await this.cacheService.del(UserCacheKeys.byEmail(user.email));
      await this.cacheService.delPattern(UserCacheKeys.listPattern);

      return user;
    } catch (err) {
      if (this.prismaService.isPrismaRecordNotFoundError(err)) {
        throw new UserNotFoundError({ field: 'id', value: id });
      }
      throw err;
    }
  }

  /**
   * Update user password
   * @param id 
   * @param newPassword 
   * @param tx Optional transaction client
   * @throws UserNotFoundError if user not found
   */
  async updatePassword(id: string, newPassword: string, tx?: TransactionClient) {
    try {
      const client = tx || this.prismaService;

      await client.user.update({
        where: { id },
        data: {
          password: newPassword,
          passwordChangedAt: new Date(),
        },
      });

      // Invalidate cache for updated user
      await this.cacheService.del(UserCacheKeys.byId(id));
      await this.cacheService.delPattern(UserCacheKeys.userPattern(id));

    } catch (err) {
      if (this.prismaService.isPrismaRecordNotFoundError(err)) {
        throw new UserNotFoundError({ field: 'id', value: id });
      }
      throw err;
    }
  }

  /**
   * Create user (untuk OAuth atau admin)
   * @throws UserAlreadyExistsError jika email sudah terdaftar
   */
  async create(data: CreateUserParams, tx?: TransactionClient) {
    try {
      const client = tx || this.prismaService;

      const newUser = client.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          password: data.password,
          emailVerified: data.emailVerified ?? false,
          emailVerifiedAt: data.emailVerified ? new Date() : null,
          provider: data.provider || AuthProvider.LOCAL,
          providerId: data.providerId,
          role: data.role || Role.CUSTOMER,
          status: data.status || UserStatus.INACTIVE,
          // Create address if provided
          ...(data.address && {
            addresses: {
              create: {
                label: data.address.label,
                recipient: data.address.recipient,
                phone: data.address.phone,
                street: data.address.street,
                city: data.address.city,
                province: data.address.province,
                postalCode: data.address.postalCode,
                country: data.address.country || 'Indonesia',
                latitude: data.address.latitude,
                longitude: data.address.longitude,
                isDefault: data.address.isDefault ?? true,
              },
            },
          }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          gender: true,
          role: true,
          status: true,
          provider: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
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
              isDefault: true,
            },
          },
        },
      });

      // Invalidate cache for user list
      // TODO : Bisa dioptimasi dengan cache tags nanti
      // TODO : Event Driven cache invalidation dengan Outbox / Message Queue (BullMQ)
      await this.cacheService.del(UserCacheKeys.emailExists(data.email));
      await this.cacheService.delPattern(UserCacheKeys.listPattern);

      return newUser;
    } catch (err) {
      if (this.prismaService.isPrismaUniqueError(err, 'email')) {
        throw new UserEmailAlreadyExistsError(data.email);
      }
      throw err;
    }
  }

  /**
   * Update atau create user (untuk OAuth login)
   */
  async upsertOAuthUser(data: {
    email: string;
    name: string;
    provider: AuthProvider;
    providerId: string;
  }) {
    return this.prismaService.user.upsert({
      where: { email: data.email },
      update: {
        firstName: data.name,
        provider: data.provider,
        providerId: data.providerId,
      },
      create: {
        email: data.email,
        firstName: data.name,
        provider: data.provider,
        providerId: data.providerId,
        role: Role.CUSTOMER,
        gender: 'FEMALE'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        role: true,
        provider: true,
        providerId: true,
      },
    });
  }

  async updateLastLogin(userId: string, tx?: TransactionClient): Promise<void> {
    const client = tx || this.prismaService;

    await client.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Clear all refresh tokens for a user (e.g., on logout from all devices)
   * @param userId 
   * @returns boolean indicating success or failure
   * @throws UserNotFoundError if user does not exist
   */
  async clearRefreshTokens(userId: string, tx?: TransactionClient): Promise<boolean> {
    try {
      const client = tx || this.prismaService;

      await client.user.update({
        where: { id: userId },
        data: { refreshTokens: [] }
      });

      // Invalidate cache for user's refresh tokens
      await this.cacheService.del(UserCacheKeys.refreshTokens(userId));
      await this.cacheService.delPattern(UserCacheKeys.userPattern(userId));

      return true;

    } catch (err) {

      if (this.prismaService.isPrismaRecordNotFoundError(err)) {
        throw new UserNotFoundError({ field: 'id', value: userId });
      }

      return false
    }
  }

  /**
   * Add a refresh token to user's list of tokens
   * @param userId 
   * @param refreshToken 
   * @param tx 
   * @returns boolean indicating success or failure
   * @throws UserNotFoundError if user does not exist
   */
  async addRefreshToken(userId: string, refreshToken: string, tx?: TransactionClient): Promise<boolean> {
    const client = tx || this.prismaService;

    // TODO: Limit the number of stored refresh tokens to prevent unlimited growth : 5
    // TODO: So, use Array.shift() if length exceeds limit

    try {
      await client.user.update({
        where: { id: userId },
        data: {
          refreshTokens: {
            push: refreshToken,
          },
        },
      });

      // Invalidate cache for user's refresh tokens
      await this.cacheService.del(UserCacheKeys.refreshTokens(userId));
      await this.cacheService.delPattern(UserCacheKeys.userPattern(userId));

      return true;
    } catch (err) {

      if (this.prismaService.isPrismaRecordNotFoundError(err)) {
        throw new UserNotFoundError({ field: 'id', value: userId });
      }
      return false;
    }
  }

  async removeRefreshToken(userId: string, refreshToken: string, tx?: TransactionClient): Promise<boolean> {
    const client = tx || this.prismaService;

    try {
      const user = await client.user.findUnique({
        where: { id: userId },
        select: { refreshTokens: true },
      });
      if (!user) {
        throw new UserNotFoundError({ field: 'id', value: userId });
      }
      const updatedTokens = user.refreshTokens.filter(token => token !== refreshToken);

      await client.user.update({
        where: { id: userId },
        data: { refreshTokens: updatedTokens },
      });
      // Invalidate cache for user's refresh tokens
      await this.cacheService.del(UserCacheKeys.refreshTokens(userId));
      await this.cacheService.delPattern(UserCacheKeys.userPattern(userId));
      return true;
    } catch (err) {

      if (this.prismaService.isPrismaRecordNotFoundError(err)) {
        throw new UserNotFoundError({ field: 'id', value: userId });
      }
      if (err instanceof UserNotFoundError) {
        throw err;
      }
      return false;
    }
  }

  /**
   * Mark user's email as verified
   * @param userId 
   * @param tx Optional transaction client
   * @returns Updated user with emailVerifiedAt, email, status, id, firstName, lastName
   * @throws UserNotFoundError if user does not exist
   */
  async markEmailAsVerified(userId: string, tx?: TransactionClient): Promise<Pick<User, 'emailVerifiedAt' | 'email' | 'status' | 'id' | 'firstName' | 'lastName'>> {
    try {
      const client = tx || this.prismaService;

      const result = await client.user.update({
        where: { id: userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: UserStatus.ACTIVE,
        },
        select: {
          emailVerifiedAt: true,
          status: true,
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        }
      });

      // Invalidate cache for updated user
      await this.cacheService.del(UserCacheKeys.byId(userId));
      await this.cacheService.del(UserCacheKeys.byEmail(result.email));
      await this.cacheService.delPattern(UserCacheKeys.userPattern(userId));

      return result;

    } catch (err) {
      if (this.prismaService.isPrismaRecordNotFoundError(err)) {
        throw new UserNotFoundError({ field: 'id', value: userId });
      }
      throw err
    }
  }

  /**
   * Check if an email already exists in the database
   * @param email 
   * @returns boolean 
   */
  async isEmailExists(email: string): Promise<boolean> {
    // Cache-aside pattern with 10 minutes TTL
    const cacheKey = UserCacheKeys.emailExists(email);

    return this.cacheService.wrap(
      cacheKey,
      async () => {
        return !!(await this.prismaService.user.findUnique({
          where: { email },
          select: { id: true }, // Only select id for minimal data transfer
        }));
      },
      UserCacheTTL.EMAIL_EXISTS,
    );
  }
}
