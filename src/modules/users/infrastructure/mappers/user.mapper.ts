import { User } from "src/generated/prisma/client";
import { UserEntity } from "../../domain";
import { createMapper } from "src/modules/users/infrastructure/mappers/mapper-helper";

export class UserMapper {
  static toDomain(user: User): UserEntity {
    return new UserEntity({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber ?? undefined,
      phoneVerified: user.phoneVerified,
      password: user.password ?? undefined,

      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      dateOfBirth: user.dateOfBirth ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      gender: this.gender.toEntity(user.gender),

      role: this.role.toEntity(user.role),
      status: this.status.toEntity(user.status),
      refreshTokens: user.refreshTokens,

      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt ?? undefined,
    });
  }

  static toPersistence(entity: UserEntity): User {
    // Mapping logic here
    return {
      id: entity.id,
      email: entity.email,
      emailVerified: entity.emailVerified,
      phoneNumber: entity.phoneNumber ?? null,
      phoneVerified: entity.phoneVerified,
      password: entity.password ?? null,
      firstName: entity.firstName ?? null,
      lastName: entity.lastName ?? null,
      dateOfBirth: entity.dateOfBirth ?? null,
      avatarUrl: entity.avatarUrl ?? null,
      gender: this.gender.toPrisma(entity.gender),
      role: this.role.toPrisma(entity.role),
      status: this.status.toPrisma(entity.status),
      refreshTokens: entity.refreshTokens,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      lastLoginAt: entity.lastLoginAt ?? null,

      provider: null, // Assuming provider is not part of UserEntity
      providerId: null, // Assuming providerId is not part of UserEntity
      deletedAt: null, // Assuming deletedAt is not part of UserEntity
      emailVerifiedAt: null, // Assuming emailVerifiedAt is not part of UserEntity
      passwordChangedAt: null, // Assuming passwordChangedAt is not part of UserEntity
      phoneVerifiedAt: null, // Assuming phoneVerifiedAt is not part of UserEntity
    };
  }

  static role = createMapper<UserEntity["role"], User["role"]>({
    admin: "ADMIN",
    user: "CUSTOMER",
    moderator: "STAFF",
  });

  static status = createMapper<UserEntity["status"], User["status"]>({
    active: "ACTIVE",
    inactive: "INACTIVE",
    deleted: "DELETED",
    suspended: "SUSPENDED"
  });

  static gender = createMapper<UserEntity["gender"], User["gender"]>({
    female: "FEMALE",
    male: "MALE",
  });
}