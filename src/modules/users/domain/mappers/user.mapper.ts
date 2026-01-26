import { User } from "src/generated/prisma/client";
import { UserEntity, UserGender, UserRole, UserStatus } from "../entities/user.entity";

export class UserMapper {
  static toEntity(user: User): UserEntity {
    return new UserEntity({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      password: user.password ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      gender: user.gender as UserGender,
      dateOfBirth: user.dateOfBirth ?? undefined,
      phoneNumber: user.phoneNumber ?? undefined,
      phoneVerified: user.phoneVerified ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      refreshTokens: user.refreshTokens ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt ?? undefined,
    });
  }

  static toEntities(users: User[]): UserEntity[] {
    return users.map(user => this.toEntity(user));
  }
}