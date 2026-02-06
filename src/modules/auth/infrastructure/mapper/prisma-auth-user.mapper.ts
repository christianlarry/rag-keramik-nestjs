import { UserStatus as PrismaUserStatus, Role as PrismaRole, AuthProvider as PrismaAuthProvider } from "src/generated/prisma/enums";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { Email } from "src/modules/users/domain/value-objects/email.vo";
import { Password } from "../../domain/value-objects/password.vo";
import { Role } from "src/modules/users/domain/value-objects/role.vo";
import { Status } from "src/modules/users/domain/value-objects/status.vo";
import { AuthProvider } from "../../domain/value-objects/auth-provider.vo";

interface RawAuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  password: string | null;
  role: PrismaRole;
  status: PrismaUserStatus;
  refreshTokens: string[];
  provider: PrismaAuthProvider;
  providerId: string | null;
  lastLoginAt: Date | null;
  loginAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaAuthUserMapper {
  static toDomain(raw: RawAuthUser): AuthUser {

    const email = Email.create(raw.email)
    const password = raw.password ? Password.fromHash(raw.password) : null;
    const role = Role.create(raw.role);
    const status = Status.create(raw.status);
    const provider = AuthProvider.create(raw.provider, raw.providerId);

    return AuthUser.reconstruct(raw.id, {
      email: email,
      emailVerified: raw.emailVerified,
      emailVerifiedAt: raw.emailVerifiedAt,
      password: password,
      role: role,
      status: status,
      refreshTokens: raw.refreshTokens,
      lastLoginAt: raw.lastLoginAt,
      loginAttempts: raw.loginAttempts,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      provider: provider
    })
  }

  static toPersistence(user: AuthUser): RawAuthUser {
    return {
      id: user.id.getValue(),
      email: user.email.getValue(),
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      password: user.password ? user.password.getValue() : null,
      role: user.role.getValue() as PrismaRole,
      status: user.status.getValue() as PrismaUserStatus,
      refreshTokens: user.refreshTokens,
      provider: user.provider.getProvider() as PrismaAuthProvider,
      providerId: user.provider.getProviderId(),
      lastLoginAt: user.lastLoginAt,
      loginAttempts: user.loginAttempts,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}