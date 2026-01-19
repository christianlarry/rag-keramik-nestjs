import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider, Role, UserStatus } from 'src/generated/prisma/enums';
import { ICreateUser } from './interfaces/create-user.interface';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { AllConfigType } from 'src/config/config.type';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {

  private readonly logger = new Logger(UsersService.name);

  // Inject PrismaService (tidak perlu import PrismaModule karena @Global)
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService<AllConfigType>,
  ) { }
  /**
   * Find user by ID
   */
  async findById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailVerifiedAt: true,
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

    return user;
  }

  /**
   * Find user by email (untuk authentication)
   */
  async findByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
      // Include password untuk verification
    });
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
  }

  /**
   * Update user profile
   */
  async update(id: string, data: { name?: string; email?: string }) {
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

    return user;
  }

  /**
   * Create user (untuk OAuth atau admin)
   */
  async create(data: ICreateUser, tx?: TransactionClient) {

    const client = tx || this.prismaService;

    return client.user.create({
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

  /**
   * Get user status
   * @param userId
   * @return UserStatus enum value or null if user not found
   */
  async getStatus(userId: string): Promise<UserStatus | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    // TODO : Save status to cache for faster access with TTL of 5 minutes
    // TODO : Invalidate cache when user status is updated

    return user?.status || null;
  }

  /**
   * Get user's refresh tokens
   * @param userId 
   * @returns Array of refresh tokens or null if user not found
   */
  async getRefreshTokens(userId: string): Promise<string[] | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { refreshTokens: true },
    });

    // TODO : Save refresh tokens to cache for faster access with TTL of 5 minutes
    // TODO : Invalidate cache when refresh tokens are updated

    return user?.refreshTokens || null;
  }

  /**
   * Clear all refresh tokens for a user (e.g., on logout from all devices)
   * @param userId 
   * @returns boolean indicating success or failure
   */
  async clearRefreshTokens(userId: string): Promise<boolean> {
    try {
      await this.prismaService.user.update({
        where: { id: userId },
        data: { refreshTokens: [] }
      });

      // TODO: Invalidate cache for user's refresh tokens

      return true;

    } catch (err) {
      if (this.configService.get('app.nodeEnv', { infer: true }) !== 'development') {
        this.logger.error(`Failed to clear refresh tokens for user ${userId}: ${err.message}`);
      }

      return false
    }
  }

  /**
   * Mark user's email as verified
   * @param userId 
   */
  async markEmailAsVerified(userId: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      },
    });
  }
}
