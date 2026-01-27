import { User as PrismaUser, Address as PrismaAddress } from "src/generated/prisma/client";
import { User } from "../../domain";
import { createMapper } from "src/infrastructure/database/prisma/helper/mapper-helper";
import { AddressVO } from "../../domain/value-objects/address.vo";

type PrismaUserRaw = PrismaUser & {
  addresses: PrismaAddress[]; // Adjust the type as per your Prisma schema
};

export class UserMapper {
  static toDomain(user: PrismaUserRaw): User {



    const addressVOs = user.addresses.map(addr => new AddressVO({
      label: this.addressLabel.toEntity(addr.label),
      recipient: addr.recipient,
      city: addr.city,
      country: addr.country,
      phone: addr.phone,
      postalCode: addr.postalCode,
      province: addr.province,
      street: addr.street,
      latitude: addr.latitude ? Number(addr.latitude) : undefined,
      longitude: addr.longitude ? Number(addr.longitude) : undefined,
    }));

    return new User({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber ?? undefined,
      phoneVerified: user.phoneVerified,
      passwordHash: user.password ?? undefined,

      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      dateOfBirth: user.dateOfBirth ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      gender: this.gender.toEntity(user.gender),

      role: this.role.toEntity(user.role),
      status: this.status.toEntity(user.status),
      refreshTokens: user.refreshTokens,
      provider: this.provider.toEntity(user.provider),

      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt ?? undefined,

      addresses: addressVOs
    });
  }

  static toArrayDomain(users: PrismaUser[]): User[] {
    return users.map(this.toDomain);
  }

  static toPersistence(entity: User): PrismaUser {
    // Mapping logic here
    return {
      id: entity.id,
      email: entity.email,
      emailVerified: entity.emailVerified,
      phoneNumber: entity.phoneNumber ?? null,
      phoneVerified: entity.phoneVerified,
      password: entity.passwordHash ?? null,
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
      provider: this.provider.toPrisma(entity.provider),

      providerId: null, // Assuming providerId is not part of UserEntity
      deletedAt: null, // Assuming deletedAt is not part of UserEntity
      emailVerifiedAt: null, // Assuming emailVerifiedAt is not part of UserEntity
      passwordChangedAt: null, // Assuming passwordChangedAt is not part of UserEntity
      phoneVerifiedAt: null, // Assuming phoneVerifiedAt is not part of UserEntity
    };
  }

  static role = createMapper<User["role"], PrismaUser["role"]>({
    admin: "ADMIN",
    user: "CUSTOMER",
    moderator: "STAFF",
  });

  static status = createMapper<User["status"], PrismaUser["status"]>({
    active: "ACTIVE",
    inactive: "INACTIVE",
    deleted: "DELETED",
    suspended: "SUSPENDED"
  });

  static gender = createMapper<User["gender"], PrismaUser["gender"]>({
    female: "FEMALE",
    male: "MALE",
  });

  static provider = createMapper<User["provider"], PrismaUser["provider"]>({
    google: "GOOGLE",
    facebook: "FACEBOOK",
    local: "LOCAL",
  });

  static addressLabel = createMapper<AddressVO["label"], PrismaAddress["label"]>({
    home: "HOME",
    work: "OFFICE",
    other: "OTHER",
  });
}