import { Email } from "src/modules/users/domain/value-objects/email.vo";
import { UserId } from "src/modules/users/domain/value-objects/user-id.vo";
import { Password } from "../value-objects/password.vo";
import { Role } from "src/modules/users/domain/value-objects/role.vo";
import { Status } from "src/modules/users/domain/value-objects/status.vo";
import { AuthProvider } from "../value-objects/auth-provider.vo";
import { InvalidProviderError } from "../errors/invalid-provider.error";
import { InvalidAuthStateError } from "../errors";
import { AggregateRoot } from "src/core/domain/aggregates/aggregate-root.base";
import { UserRegisteredEvent } from "../events/user-registered.event";

export class AuthUser extends AggregateRoot {

  private readonly _id: UserId;
  private props: AuthUserProps;

  private constructor(
    id: UserId,
    props: AuthUserProps
  ) {
    super();

    this._id = id;
    this.props = props;

    this.validate();
  }

  public static register(params: RegisterParams): AuthUser {
    const authUser = new AuthUser(UserId.generate(),
      {
        email: params.email,
        emailVerified: false,
        emailVerifiedAt: null,
        password: params.password,
        role: params.role || Role.createCustomer(),
        status: Status.create('active'),
        provider: AuthProvider.createLocal(),
        lastLoginAt: null,
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }
    );

    // Emit UserRegisteredEvent
    authUser.addDomainEvent(
      new UserRegisteredEvent({
        userId: authUser.id.toString(),
        email: authUser.email.toString()
      })
    )

    return authUser;
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
        lastLoginAt: null,
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
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

    // Ensure lastLoginAt is not in the future
    if (this.props.lastLoginAt && this.props.lastLoginAt > new Date()) {
      throw new InvalidAuthStateError('Last login date cannot be in the future');
    }

    // Ensure emailVerified is false if emailVerifiedAt is null
    if (!this.props.emailVerified && this.props.emailVerifiedAt !== null) {
      throw new InvalidAuthStateError('Email verified date must be null if email is not verified');
    }

    // Ensure emailVerifiedAt is set if emailVerified is true
    if (this.props.emailVerified && this.props.emailVerifiedAt === null) {
      throw new InvalidAuthStateError('Email verified date must be set if email is verified');
    }

    // Ensure createdAt is not in the future
    if (this.props.createdAt && this.props.createdAt > new Date()) {
      throw new InvalidAuthStateError('Creation date cannot be in the future');
    }

    // Ensure updatedAt is not before createdAt
    if (this.props.createdAt && this.props.updatedAt && this.props.updatedAt < this.props.createdAt) {
      throw new InvalidAuthStateError('Update date cannot be before creation date');
    }

    // Ensure updatedAt is not in the future
    if (this.props.updatedAt && this.props.updatedAt > new Date()) {
      throw new InvalidAuthStateError('Update date cannot be in the future');
    }

    // Ensure if user is not active, refreshTokens list is empty
    if (!this.props.status.isActive() && this.props.refreshTokens.length > 0) {
      throw new InvalidAuthStateError('Inactive users cannot have active refresh tokens');
    }

    // Ensure refresh tokens are valid strings
    if (this.props.refreshTokens.some(token => !token || token.trim() === '')) {
      throw new InvalidAuthStateError('Refresh tokens cannot contain empty or invalid tokens');
    }

    // Ensure deletedAt is set appropriately based on status
    if (this.props.deletedAt === null && this.props.status.isDeleted()) {
      throw new InvalidAuthStateError('Deleted users must have a deletedAt timestamp');
    }

    // Ensure deletedAt is null if user is not deleted
    if (this.props.deletedAt !== null && !this.props.status.isDeleted()) {
      throw new InvalidAuthStateError('Only deleted users can have a deletedAt timestamp');
    }

    // Ensure deletedAt is not in the future
    if (this.props.deletedAt !== null && this.props.deletedAt > new Date()) {
      throw new InvalidAuthStateError('DeletedAt timestamp cannot be in the future');
    }
  }

  // ===== Query methods ===== //
  public canLogin(): boolean {
    return (
      this.props.status.isActive() &&
      (this.props.provider.isLocal() || this.props.provider.isOAuth()) &&
      (this.props.emailVerified || this.props.emailVerifiedAt !== null)
    );
  }

  public isUsingOAuthProvider(): boolean {
    return this.props.provider.isOAuth();
  }

  public isUsingLocalProvider(): boolean {
    return this.props.provider.isLocal();
  }

  // ===== Command methods ===== //

  public addRefreshToken(token: string): void {
    if (!this.props.status.isActive()) {
      throw new InvalidAuthStateError('Cannot add refresh token to inactive user');
    }
    this.props.refreshTokens.push(token);
    this.validate();
    this.props.updatedAt = new Date();
  }

  public removeRefreshToken(token: string): void {
    this.props.refreshTokens = this.props.refreshTokens.filter(t => t !== token);
    this.validate();
    this.props.updatedAt = new Date();
  }

  public clearRefreshTokens(): void {
    this.props.refreshTokens = [];
    this.validate();
    this.props.updatedAt = new Date();
  }

  public markEmailAsVerified(): void {
    this.props.emailVerified = true;
    this.props.emailVerifiedAt = new Date();

    this.validate();
    this.props.updatedAt = new Date();
  }

  public recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.validate();
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.status = Status.create('inactive');
    this.validate();
    this.props.updatedAt = new Date();
    this.clearRefreshTokens();
  }

  public activate(): void {
    this.props.status = Status.create('active');
    this.validate();
    this.props.updatedAt = new Date();
    this.clearRefreshTokens();
  }

  public suspend(): void {
    this.props.status = Status.create('suspended');
    this.validate();
    this.props.updatedAt = new Date();
    this.clearRefreshTokens();
  }

  public softDelete(): void {
    this.props.status = Status.create('deleted');
    this.clearRefreshTokens();
    this.props.deletedAt = new Date();

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
    this.clearRefreshTokens();
  }

  // ===== Getters ===== //
  public get id(): UserId { return this._id; }
  public get email(): Email { return this.props.email; }
  public get emailVerified(): boolean { return this.props.emailVerified; }
  public get emailVerifiedAt(): Date | null { return this.props.emailVerifiedAt; }
  public get password(): Password | null { return this.props.password; }
  public get role(): Role { return this.props.role; }
  public get status(): Status { return this.props.status; }
  public get provider(): AuthProvider { return this.props.provider; }
  public get lastLoginAt(): Date | null { return this.props.lastLoginAt; }
  public get refreshTokens(): string[] { return this.props.refreshTokens; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }
  public get deletedAt(): Date | null { return this.props.deletedAt; }
}

interface AuthUserProps {
  email: Email;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  password: Password | null;
  role: Role;
  status: Status;
  provider: AuthProvider;
  lastLoginAt: Date | null;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
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