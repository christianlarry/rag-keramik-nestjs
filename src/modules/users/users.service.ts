import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from 'src/generated/prisma/enums';

@Injectable()
export class UsersService {
  // Inject PrismaService (tidak perlu import PrismaModule karena @Global)
  constructor(private readonly prismaService: PrismaService) { }

  /**
   * Find user by ID
   */
  async findById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        // password tidak di-return untuk security
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

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
          name: true,
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
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Create user (untuk OAuth atau admin)
   */
  async create(data: {
    email: string;
    name?: string;
    password?: string;
    provider?: string;
    providerId?: string;
    role?: Role;
  }) {
    return this.prismaService.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        provider: data.provider || 'local',
        providerId: data.providerId,
        role: data.role || Role.CUSTOMER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        createdAt: true,
      },
    });
  }

  /**
   * Update atau create user (untuk OAuth login)
   */
  async upsertOAuthUser(data: {
    email: string;
    name: string;
    provider: string;
    providerId: string;
  }) {
    return this.prismaService.user.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        provider: data.provider,
        providerId: data.providerId,
      },
      create: {
        email: data.email,
        name: data.name,
        provider: data.provider,
        providerId: data.providerId,
        role: Role.CUSTOMER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        providerId: true,
      },
    });
  }
}
