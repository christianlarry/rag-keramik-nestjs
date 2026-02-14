import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/infrastructure/persistence/prisma/prisma.service";
import {
  FindAllUsersQueryOptions,
  FindAllUsersQueryResult,
  UserDetailResult,
  UserQueryRepository,
} from "../../domain/repositories/user-query-repository.interface";

@Injectable()
export class PrismaUserQueryRepository implements UserQueryRepository {
  constructor(private readonly prisma: PrismaService) { }

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

    return {
      users: users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total
    };
  }

  async getUserDetailById(userId: string): Promise<UserDetailResult | null> {
    const user = await this.prisma.getClient().user.findUnique({
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

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      role: user.role,
      status: user.status,
      addresses: user.addresses.map(addr => ({
        label: addr.label,
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
    };
  }
}
