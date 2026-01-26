import { Injectable } from "@nestjs/common";
import {
  IUserQueryRepository,
  UserAuthDto,
  UserAuthWithPasswordDto,
  UserProfileDto,
  UserListItemDto,
  SearchOptions,
  PaginationOptions,
} from "../../domain";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { UserRole } from "../../domain/types/user.type";
import { UserMapper } from "../mappers/user.mapper";

@Injectable()
export class UserQueryRepository implements IUserQueryRepository {
  constructor(private readonly prismaService: PrismaService) { }

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

  async checkEmailExists(email: string): Promise<boolean> {
    const count = await this.prismaService.user.count({
      where: { email },
    });

    return count > 0;
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
  // Existence Checks
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