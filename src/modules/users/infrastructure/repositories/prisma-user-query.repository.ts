import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/infrastructure/persistence/prisma/prisma.service";
import {
  FindAllUsersQueryOptions,
  FindAllUsersQueryResult,
  UserDetailResult,
  UserQueryRepository,
} from "../../domain/repositories/user-query-repository.interface";
import * as prismaUserMapper from "../mappers/prisma-user.mapper"
import { CacheService } from "src/core/infrastructure/services/cache/cache.service";
import { UserCache } from "../cache/user.cache";

@Injectable()
export class PrismaUserQueryRepository implements UserQueryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) { }

  async findAllUsers(options?: FindAllUsersQueryOptions): Promise<FindAllUsersQueryResult> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: any = {};

    if (options?.role) {
      where.role = options.role;
    }

    if (options?.status) {
      where.status = options.status;
    }

    // Get current cache version for list keys
    const version = await this.cache.get<number>(UserCache.getUserListVersionKey()) || 0;

    // Cache Key with version
    const cacheKey = UserCache.getUserListKey({ page, limit, role: options?.role, status: options?.status, version });

    // Try to get from cache, if not found execute the query and cache the result
    const result = await this.cache.wrap(
      cacheKey,
      async () => {
        // Execute count and find queries in parallel
        const [total, users] = await Promise.all([
          this.prisma.getClient().user.count({ where }),
          this.prisma.getClient().user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              fullName: true,
              email: true,
              dateOfBirth: true,
              gender: true,
              avatarUrl: true,
              phoneNumber: true,
              phoneVerified: true,
              role: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            }
          })
        ]);

        return { users, total };
      },
      UserCache.USER_LIST_TTL
    )

    return {
      users: result.users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        gender: user.gender ? prismaUserMapper.genderMapper.toEntity(user.gender) : null,
        dateOfBirth: user.dateOfBirth,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        role: prismaUserMapper.roleMapper.toEntity(user.role),
        status: prismaUserMapper.statusMapper.toEntity(user.status),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total: result.total
    };
  }

  async getUserDetailById(userId: string): Promise<UserDetailResult | null> {

    const cacheKey = UserCache.getUserDetailByIdKey(userId);

    const user = await this.cache.wrap(
      cacheKey,
      async () => {
        return await this.prisma.getClient().user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            fullName: true,
            email: true,
            dateOfBirth: true,
            gender: true,
            avatarUrl: true,
            phoneNumber: true,
            phoneVerified: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            addresses: {
              select: {
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
      },
      UserCache.USER_DETAIL_TTL
    );

    return user ? {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      gender: user.gender ? prismaUserMapper.genderMapper.toEntity(user.gender) : null,
      dateOfBirth: user.dateOfBirth,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      role: prismaUserMapper.roleMapper.toEntity(user.role),
      status: prismaUserMapper.statusMapper.toEntity(user.status),
      addresses: user.addresses.map(addr => ({
        label: prismaUserMapper.addressLabelMapper.toEntity(addr.label),
        recipient: addr.recipient,
        phone: addr.phone,
        street: addr.street,
        city: addr.city,
        province: addr.province,
        postalCode: addr.postalCode,
        country: addr.country,
        latitude: addr.latitude ? Number(addr.latitude) : null,
        longitude: addr.longitude ? Number(addr.longitude) : null,
        isDefault: addr.isDefault,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } : null;
  }
}
