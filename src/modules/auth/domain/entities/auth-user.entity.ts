import { Email } from "src/modules/users/domain/value-objects/email.vo";
import { UserId } from "src/modules/users/domain/value-objects/user-id.vo";
import { Password } from "../value-objects/password.vo";
import { Role } from "src/modules/users/domain/value-objects/role.vo";
import { Status } from "src/modules/users/domain/value-objects/status.vo";
import { AuthProvider } from "../value-objects/auth-provider.vo";
import { InvalidProviderError } from "../errors/invalid-provider.error";

export class AuthUser {

  private readonly id: UserId;
  private props: AuthUserProps;

  private constructor(
    id: UserId,
    props: AuthUserProps
  ) {
    this.id = id;
    this.props = props;

    this.validate();
  }

  public static register(params: RegisterParams): AuthUser {
    return new AuthUser(UserId.generate(),
      {
        email: params.email,
        emailVerified: false,
        emailVerifiedAt: null,
        password: params.password,
        role: params.role || Role.createCustomer(),
        status: Status.create('active'),
        provider: AuthProvider.createLocal(),
        loginAttempts: 0,
        lastLoginAt: null
      }
    );
  }

  public static fromOAuth(params: OAuthParams): AuthUser {

    if (params.provider.isOAuth() === false) {
      throw new InvalidProviderError('Auth provider must be an OAuth provider');
    }

    return new AuthUser(UserId.generate(),
      {
        email: params.email,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        password: null,
        role: params.role || Role.createCustomer(),
        status: Status.create('active'),
        provider: params.provider,
        loginAttempts: 0,
        lastLoginAt: null
      }
    );
  }

  public static reconstruct(id: string, props: AuthUserProps): AuthUser {
    return new AuthUser(UserId.fromString(id), props);
  }

  private validate(): void {
    // Implement validation logic here
  }
}

interface AuthUserProps {
  email: Email;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  password: Password | null;
  role: Role;
  status: Status;
  provider: AuthProvider;
  loginAttempts: number;
  lastLoginAt: Date | null;
}

interface RegisterParams {
  email: Email;
  password: Password;
  role?: Role;
}

interface OAuthParams {
  email: Email;
  provider: AuthProvider;
  role?: Role;
}