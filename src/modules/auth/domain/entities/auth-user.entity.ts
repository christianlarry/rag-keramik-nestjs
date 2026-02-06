import { Email } from "src/modules/users/domain/value-objects/email.vo";
import { UserId } from "src/modules/users/domain/value-objects/user-id.vo";
import { Password } from "../value-objects/password.vo";
import { Role } from "src/modules/users/domain/value-objects/role.vo";
import { Status } from "src/modules/users/domain/value-objects/status.vo";
import { AuthProvider } from "../value-objects/auth-provider.vo";
import { InvalidProviderError } from "../errors/invalid-provider.error";
import { InvalidAuthStateError } from "../errors";

export class AuthUser {

  private readonly _id: UserId;
  private props: AuthUserProps;

  private constructor(
    id: UserId,
    props: AuthUserProps
  ) {
    this._id = id;
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
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
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
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );
  }

  public static reconstruct(id: string, props: AuthUserProps): AuthUser {
    return new AuthUser(UserId.fromString(id), props);
  }

  private validate(): void {
    // Ensure password is provided for local provider
    if (this.props.provider.isLocal() && this.props.password === null) {
      throw new InvalidAuthStateError('Password cannot be null for local provider');
    }

    // Ensure password is null for OAuth providers
    if (this.props.provider.isOAuth() && this.props.password !== null) {
      throw new InvalidAuthStateError('Password must be null for OAuth provider');
    }

    // Ensure email is verified for OAuth providers
    if (
      (this.props.provider.isOAuth() && this.props.emailVerified === false) ||
      (this.props.provider.isOAuth() && this.props.emailVerifiedAt === null)
    ) {
      throw new InvalidAuthStateError('Email must be verified for OAuth provider');
    }

    // Ensure email verified is false if User is not Active
    if (!this.props.status.isActive() && this.props.emailVerified) {
      throw new InvalidAuthStateError('Email cannot be verified if user is not active');
    }

    // Ensure emailVerifiedAt is not in the future
    if (this.props.emailVerifiedAt && this.props.emailVerifiedAt > new Date()) {
      throw new InvalidAuthStateError('Email verified date cannot be in the future');
    }

    // Additional validations
    if (this.props.loginAttempts < 0) {
      throw new InvalidAuthStateError('Login attempts cannot be negative');
    }

    // Ensure lastLoginAt is not in the future
    if (this.props.lastLoginAt && this.props.lastLoginAt > new Date()) {
      throw new InvalidAuthStateError('Last login date cannot be in the future');
    }

    // Ensure loginAttempts is zero if user is not Active
    if (!this.props.status.isActive() && this.props.loginAttempts > 0) {
      throw new InvalidAuthStateError('Inactive users cannot have login attempts');
    }

    // Ensure emailVerified is false if emailVerifiedAt is null
    if (!this.props.emailVerified && this.props.emailVerifiedAt !== null) {
      throw new InvalidAuthStateError('Email verified date must be null if email is not verified');
    }

    // Ensure emailVerifiedAt is set if emailVerified is true
    if (this.props.emailVerified && this.props.emailVerifiedAt === null) {
      throw new InvalidAuthStateError('Email verified date must be set if email is verified');
    }
  }

  // ===== Query methods ===== //
  public canLogin(): boolean {
    return (
      this.props.status.isActive() &&
      (this.props.provider.isLocal() || this.props.provider.isOAuth()) &&
      (this.props.emailVerified || this.props.emailVerifiedAt !== null) &&
      this.props.loginAttempts < 5
    );
  }

  public isUsingOAuthProvider(): boolean {
    return this.props.provider.isOAuth();
  }

  public isUsingLocalProvider(): boolean {
    return this.props.provider.isLocal();
  }

  // ===== Command methods ===== //
  public markEmailAsVerified(): void {
    this.props.emailVerified = true;
    this.props.emailVerifiedAt = new Date();

    this.validate();
    this.props.updatedAt = new Date();
  }

  public recordLoginAttempt(successful: boolean): void {
    if (successful) {
      this.props.loginAttempts = 0;
      this.props.lastLoginAt = new Date();
    } else {
      this.props.loginAttempts += 1;
    }

    // Suspend account after 5 failed attempts
    if (this.props.loginAttempts >= 5) {
      this.suspend();
      this.props.loginAttempts = 0; // reset after suspension
    }

    this.validate();
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.status = Status.create('inactive');
    this.validate();
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.status = Status.create('active');
    this.validate();
    this.props.updatedAt = new Date();
  }

  public suspend(): void {
    this.props.status = Status.create('suspended');
    this.validate();
    this.props.updatedAt = new Date();
  }

  public softDelete(): void {
    this.props.status = Status.create('deleted');
    this.validate();
    this.props.updatedAt = new Date();
  }

  public changePassword(newPassword: Password): void {
    if (this.props.provider.isLocal() === false) {
      throw new InvalidAuthStateError('Cannot set password for non-local providers');
    }
    this.props.password = newPassword;
    this.validate();
    this.props.updatedAt = new Date();
  }

  // ===== Getters ===== //
  public get id(): UserId { return this.id; }
  public get email(): Email { return this.props.email; }
  public get emailVerified(): boolean { return this.props.emailVerified; }
  public get emailVerifiedAt(): Date | null { return this.props.emailVerifiedAt; }
  public get password(): Password | null { return this.props.password; }
  public get role(): Role { return this.props.role; }
  public get status(): Status { return this.props.status; }
  public get provider(): AuthProvider { return this.props.provider; }
  public get loginAttempts(): number { return this.props.loginAttempts; }
  public get lastLoginAt(): Date | null { return this.props.lastLoginAt; }
  public get createdAt(): Date | null { return this.props.createdAt; }
  public get updatedAt(): Date | null { return this.props.updatedAt; }
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
  createdAt: Date | null;
  updatedAt: Date | null;
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