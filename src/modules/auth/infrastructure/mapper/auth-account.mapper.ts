import { User } from "src/generated/prisma/client";
import {
  AuthProvider as PrismaAuthProvider,
  Role as PrismaRole,
  UserStatus as PrismaUserStatus,
} from "src/generated/prisma/enums"
import { AuthAccount } from "../../domain/entities/auth-account.entity";
import { Email } from "../../domain/value-objects/email.vo";
import { Password } from "../../domain/value-objects/password.vo";
import { PasswordHasher } from "../../domain/hasher/password-hasher.interface";
import { AuthProvider } from "../../domain/value-objects/auth-provider.vo";
import { Role, RoleType } from "../../domain/value-objects/role.vo";
import { Status } from "../../domain/value-objects/status.vo";

export type AuthAccountPersistenceFields = Pick<User,
  | 'id'
  | 'email'
  | 'emailVerified'
  | 'emailVerifiedAt'
  | 'provider'
  | 'providerId'
  | 'role'
  | 'status'
  | 'loginAttempts'
  | 'refreshTokens'
  | 'createdAt'
  | 'updatedAt'
  | 'passwordChangedAt'
>

export class AuthAccountMapper {

  constructor(
    private readonly hasher: PasswordHasher,
  ) { }

  toDomain(raw: User): AuthAccount {

    // Email VO
    const email = Email.create(raw.email);
    // Password VO
    const password = raw.password ? Password.create(raw.password, this.hasher) : null;
    // Provider VO
    const provider = AuthProvider.fromString(raw.provider);
    // Role VO
    const role = Role.fromString(raw.role);
    // Status VO
    const status = Status.fromString(raw.status);

    return AuthAccount.create({
      id: raw.id,
      email,
      password,
      emailVerified: raw.emailVerified,
      emailVerifiedAt: raw.emailVerifiedAt,
      provider,
      providerId: raw.providerId,
      role,
      status,
      failedLoginAttempts: raw.loginAttempts,
      refreshTokens: raw.refreshTokens || [],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      passwordChangedAt: raw.passwordChangedAt,
    })
  }

  toPersistence(entity: AuthAccount): AuthAccountPersistenceFields {
    return {
      id: entity.id,
      email: entity.email.getValue(),
      emailVerified: entity.emailVerified,
      emailVerifiedAt: entity.emailVerifiedAt,
      provider: authProviderMap[entity.provider.getValue()],
      providerId: entity.providerId,
      role: roleMap[entity.role.getValue()],
      status: statusMap[entity.status.getValue()],
      loginAttempts: entity.failedLoginAttempts,
      refreshTokens: entity.refreshTokens,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      passwordChangedAt: entity.passwordChangedAt,
    }
  }
}

const authProviderMap: Record<string, PrismaAuthProvider> = {
  'LOCAL': PrismaAuthProvider.LOCAL,
  'GOOGLE': PrismaAuthProvider.GOOGLE,
  'FACEBOOK': PrismaAuthProvider.FACEBOOK,
};

const roleMap: Record<RoleType, PrismaRole> = {
  'CUSTOMER': PrismaRole.CUSTOMER,
  'ADMIN': PrismaRole.ADMIN,
  'STAFF': PrismaRole.STAFF
};

const statusMap: Record<string, PrismaUserStatus> = {
  'ACTIVE': PrismaUserStatus.ACTIVE,
  'INACTIVE': PrismaUserStatus.INACTIVE,
  'SUSPENDED': PrismaUserStatus.SUSPENDED,
  'DELETED': PrismaUserStatus.DELETED,
};