import { UserStatus as PrismaUserStatus, Role as PrismaRole, AuthProviderName as PrismaAuthProviderName } from "src/generated/prisma/enums";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { Email } from "src/modules/users/domain/value-objects/email.vo";
import { Password } from "../../domain/value-objects/password.vo";
import { Role } from "src/modules/users/domain/value-objects/role.vo";
import { Status } from "src/modules/users/domain/value-objects/status.vo";
import { AuthProvider } from "../../domain/value-objects/auth-provider.vo";
import { createEnumMapper } from "src/core/infrastructure/persistence/mapper/create-enum-mapper";
import { Name } from "src/modules/users/domain/value-objects/name.vo";

interface RawAuthUser {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  password: string | null;
  role: PrismaRole;
  status: PrismaUserStatus;
  refreshTokens: string[];
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  authProviders: {
    provider: PrismaAuthProviderName;
    providerId: string;
    linkedAt: Date;
  }[];
}

export class PrismaAuthUserMapper {
  static toDomain(raw: RawAuthUser): AuthUser {

    const name = Name.create(raw.fullName);
    const email = Email.create(raw.email)
    const password = raw.password ? Password.fromHash(raw.password) : null;
    const role = Role.create(roleMapper.toEntity(raw.role));
    const status = Status.create(statusMapper.toEntity(raw.status));
    const providers = raw.authProviders.map(p => AuthProvider.reconstruct(providerMapper.toEntity(p.provider), p.providerId, p.linkedAt));

    return AuthUser.reconstruct(raw.id, {
      name: name,
      email: email,
      emailVerified: raw.emailVerified,
      emailVerifiedAt: raw.emailVerifiedAt,
      password: password,
      role: role,
      status: status,
      refreshTokens: raw.refreshTokens,
      lastLoginAt: raw.lastLoginAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
      providers: providers,
    })
  }

  static toPersistence(user: AuthUser): RawAuthUser {
    return {
      fullName: user.name.getFullName(),
      id: user.id.getValue(),
      email: user.email.getValue(),
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      password: user.password ? user.password.getValue() : null,
      role: roleMapper.toPersistence(user.role.getValue()),
      status: statusMapper.toPersistence(user.status.getValue()),
      refreshTokens: user.refreshTokens,
      authProviders: user.providers.map(p => ({
        provider: providerMapper.toPersistence(p.getProviderName()),
        providerId: p.getProviderId(),
        linkedAt: p.getLinkedAt(),
      })),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    }
  }
}

export const roleMapper = createEnumMapper<Role['value'], PrismaRole>({
  customer: 'CUSTOMER',
  admin: 'ADMIN',
  staff: 'STAFF'
});

const statusMapper = createEnumMapper<Status['value'], PrismaUserStatus>({
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  suspended: 'SUSPENDED',
  deleted: 'DELETED'
});

const providerMapper = createEnumMapper<AuthProvider['providerName'], PrismaAuthProviderName>({
  google: 'GOOGLE',
  facebook: 'FACEBOOK'
});