import { Email } from "src/modules/users/domain/value-objects/email.vo";
import { UserId } from "src/modules/users/domain/value-objects/user-id.vo";
import { Password } from "../value-objects/password.vo";
import { Role } from "src/modules/users/domain/value-objects/role.vo";
import { Status } from "src/modules/users/domain/value-objects/status.vo";
import { AuthProvider } from "../value-objects/auth-provider.vo";
import { AuthProvider as AuthProviderEnum } from "../enums/auth-provider.enum";
import { CannotAccessProtectedResourceError, CannotLoginError, CannotRefreshTokenError, CannotUnverifyEmailError, CannotVerifyEmailError, InvalidAuthStateError, InvalidProviderError } from "../errors";
import { UserRegisteredEvent } from "../events/user-registered.event";
import { CannotResetPasswordError } from "../errors/cannot-reset-password.error";
import { CannotChangePasswordError } from "../errors/cannot-change-password.error";
import { Name } from "src/modules/users/domain/value-objects/name.vo";
import { AggregateRoot } from "src/core/domain/aggregate-root.base";
import { UserLoggedInWithOAuthEvent } from "../events/user-logged-in-with-oauth.event";

interface AuthUserProps {
  name: Name;
  email: Email;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  password: Password | null;
  role: Role;
  status: Status;
  providers: AuthProvider[];
  lastLoginAt: Date | null;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface RegisterParams {
  name: Name;
  email: Email;
  password: Password;
  role?: Role;
}

interface OAuthParams {
  name: Name;
  email: Email;
  provider: AuthProvider;
  role?: Role;
}

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
        name: params.name,
        email: params.email,
        emailVerified: false,
        emailVerifiedAt: null,
        password: params.password,
        role: params.role || Role.createCustomer(),
        status: Status.createInactive(),
        providers: [],
        lastLoginAt: null,
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }
    );

    // 
    authUser.addDomainEvent(
      new UserRegisteredEvent({
        userId: authUser._id.getValue(),
        email: authUser.email.getValue()
      })
    )

    return authUser;
  }

  public static fromOAuth(params: OAuthParams): AuthUser {
    return new AuthUser(UserId.generate(),
      {
        name: params.name,
        email: params.email,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        password: null,
        role: params.role || Role.createCustomer(),
        status: Status.create('active'),
        providers: [params.provider],
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
    // Ensure email is verified for OAuth providers
    if (
      (this.isUsingOAuthProvider() && (this.props.emailVerified === false || this.props.emailVerifiedAt === null))
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

  // ==================== QUERY METHODS ==================== //

  // === Status Queries === //
  public canAccessProtectedResources(): boolean {
    return this.props.status.isActive() && this.props.emailVerified;
  }

  public isInactiveForOneWeek(): boolean {
    if (!this.props.lastLoginAt) {
      return true;
    }
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return this.props.lastLoginAt < oneWeekAgo;
  }

  public isInactiveForOneMonth(): boolean {
    if (!this.props.lastLoginAt) {
      return true;
    }
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return this.props.lastLoginAt < oneMonthAgo;
  }

  // === Email Verification Queries === //
  public canVerifyEmail(): boolean {
    return (
      !this.props.status.isActive() &&
      !this.props.emailVerified &&
      this.isUsingLocalProvider()
    );
  }

  public canUnverifyEmail(): boolean {
    return this.props.emailVerified;
  }

  // === Authentication Queries === //
  public canLogin(): boolean {
    return (
      this.props.status.isActive() &&
      (this.isUsingLocalProvider()) &&
      (this.props.emailVerified)
    );
  }

  // === Password Queries === //
  public canResetPassword(): boolean {
    return (
      this.props.status.isActive() &&
      this.isUsingLocalProvider() &&
      this.props.password !== null &&
      this.props.emailVerified &&
      this.props.emailVerifiedAt !== null
    );
  }

  public canChangePassword(): boolean {
    return this.canResetPassword();
  }

  public canForgetPassword(): boolean {
    return this.canResetPassword();
  }

  // === Provider Queries === //
  public isUsingOAuthProvider(): boolean {
    return this.props.providers.length > 0;
  }

  public isUsingLocalProvider(): boolean {
    return this.props.password !== null;
  }

  public hasProvider(providerName: AuthProviderEnum): boolean {
    return this.props.providers.some(p => p.getProviderName() === providerName);
  }

  // === Refresh Token Queries === //
  public canRefreshToken(): boolean {
    return (
      this.props.status.isActive() &&
      !this.hasNoRefreshTokens()  // User must have at least one active refresh token to be able to refresh
    );
  }

  public hasRefreshToken(token: string): boolean {
    return this.props.refreshTokens.includes(token);
  }

  public hasNoRefreshTokens(): boolean {
    return this.props.refreshTokens.length === 0;
  }

  // ==================== COMMAND METHODS ==================== //

  // === Email Verification Commands === //
  public verifyEmail(): void {
    if (!this.canVerifyEmail()) {
      throw new CannotVerifyEmailError('User cannot verify email. Either already verified, not active, or using non-local provider');
    }

    this.props.emailVerified = true;
    this.props.emailVerifiedAt = new Date();
    this.props.status = Status.createActive();

    this.props.updatedAt = new Date();
  }

  public unverifyEmail(): void {
    if (!this.canUnverifyEmail()) {
      throw new CannotUnverifyEmailError('Email is already unverified');
    }

    this.props.emailVerified = false;
    this.props.emailVerifiedAt = null;
    this.props.status = Status.createInactive();

    this.props.updatedAt = new Date();
  }

  // === Password Commands === //
  public changePassword(newPassword: Password): void {
    if (!this.canChangePassword()) {
      throw new CannotChangePasswordError('User cannot change password. Ensure user is active, using local provider, has a password set, and email is verified.');
    }

    this.props.password = newPassword;

    this.props.updatedAt = new Date();
    this.clearRefreshTokens();
  }

  public resetPassword(newPassword: Password): void {
    if (!this.canResetPassword()) {
      throw new CannotResetPasswordError('User cannot reset password. Ensure user is active, using local provider, has a password set, and email is verified.');
    }

    this.props.password = newPassword;

    this.props.updatedAt = new Date();
    this.clearRefreshTokens();
  }

  public ensureCanChangePassword(): void {
    if (!this.canChangePassword()) {
      throw new CannotChangePasswordError('User cannot change password. Ensure user is active, using local provider, has a password set, and email is verified.');
    }
  }

  public ensureCanResetPassword(): void {
    if (!this.canResetPassword()) {
      throw new CannotResetPasswordError('User cannot reset password. Ensure user is active, using local provider, has a password set, and email is verified.');
    }
  }

  // === Login Commands === //
  public ensureCanLogin(): void {
    // Manual validation so we can throw specific errors message
    if (!this.props.status.isActive()) {
      throw new CannotLoginError('User account is not active. Please contact support.');
    }
    if (!this.props.emailVerified) {
      throw new CannotLoginError('Email is not verified. Please verify your email before logging in.');
    }
    // Assume if user has password set, they can login with local provider. If not, they must be using OAuth provider, so we check if they have any linked providers
    if (this.isUsingOAuthProvider() && this.isUsingLocalProvider()) return
    if (this.isUsingOAuthProvider() && !this.isUsingLocalProvider()) {
      throw new CannotLoginError('User is registered with OAuth provider. Please login using the linked provider.');
    }
  }

  public recordSuccessfulLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }

  public recordOAuthLogin(providerName: AuthProviderEnum, profile?: { avatarUrl: string | null }): void {
    if (!this.hasProvider(providerName)) {
      throw new InvalidProviderError(`User is not linked with ${providerName} provider`);
    }
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();

    // Add Event for successful OAuth login if needed, Like: UserLoggedInWithOAuthEvent
    this.addDomainEvent(new UserLoggedInWithOAuthEvent({
      userId: this._id.getValue(),
      provider: providerName,
      email: this.props.email.getValue(),
      avatarUrl: profile?.avatarUrl || null, // Optional: You can include avatar URL if you have it in the future
      fullName: this.props.name.getFullName(), // Optional: You can include full name if you have it in the future
    }))
  }

  // === Refresh Token Commands === //
  public addRefreshToken(token: string): void {
    // Avoid adding duplicate tokens
    if (this.props.refreshTokens.includes(token)) {
      return;
    }

    // Ensure user is active before adding refresh token
    if (!this.props.status.isActive()) {
      throw new InvalidAuthStateError('Cannot add refresh token to inactive user');
    }

    this.props.refreshTokens.push(token);

    // Max 5 refresh tokens
    if (this.props.refreshTokens.length > 5) {
      this.props.refreshTokens.shift(); // Remove oldest token
    }

    this.props.updatedAt = new Date();
  }

  public removeRefreshToken(token: string): void {
    this.props.refreshTokens = this.props.refreshTokens.filter(t => t !== token);
    this.props.updatedAt = new Date();
  }

  public clearRefreshTokens(): void {
    this.props.refreshTokens = [];
    this.props.updatedAt = new Date();
  }

  public ensureCanRefreshToken(): void {
    if (!this.canRefreshToken()) {
      throw new CannotRefreshTokenError('User cannot refresh token. Ensure user is active and has at least one active refresh token.');
    }
  }

  public ensureCanAccessProtectedResources(): void {
    if (!this.canAccessProtectedResources()) {
      throw new CannotAccessProtectedResourceError('User cannot access protected resources. Ensure user is active and email is verified.');
    }
  }

  // === Status Commands === //
  public activate(): void {
    this.props.status = Status.create('active');
    this.props.updatedAt = new Date();
    this.clearRefreshTokens();
  }

  public deactivate(): void {
    this.props.status = Status.create('inactive');
    this.props.updatedAt = new Date();
    this.clearRefreshTokens();
  }

  public suspend(): void {
    this.props.status = Status.create('suspended');
    this.props.updatedAt = new Date();
    this.clearRefreshTokens();
  }

  public softDelete(): void {
    this.props.status = Status.create('deleted');
    this.clearRefreshTokens();
    this.props.deletedAt = new Date();

    this.props.updatedAt = new Date();
  }

  // === Provider Commands === //
  public linkOAuth(provider: AuthProvider): void {
    if (this.hasProvider(provider.getProviderName())) {
      throw new InvalidProviderError(`User already linked with ${provider.getProviderName()} provider`);
    }

    this.props.providers.push(provider);
    this.props.updatedAt = new Date();
  }

  public unlinkOAuth(providerName: AuthProviderEnum): void {
    if (!this.hasProvider(providerName)) {
      throw new InvalidProviderError(`User is not linked with ${providerName} provider`);
    }

    this.props.providers = this.props.providers.filter(p => p.getProviderName() !== providerName);
    this.props.updatedAt = new Date();
  }

  // ===== Getters ===== //
  public get id(): UserId { return this._id; }
  public get name(): Name { return this.props.name; }
  public get email(): Email { return this.props.email; }
  public get emailVerified(): boolean { return this.props.emailVerified; }
  public get emailVerifiedAt(): Date | null { return this.props.emailVerifiedAt; }
  public get password(): Password | null { return this.props.password; }
  public get role(): Role { return this.props.role; }
  public get status(): Status { return this.props.status; }
  public get providers(): AuthProvider[] { return this.props.providers; }
  public get lastLoginAt(): Date | null { return this.props.lastLoginAt; }
  public get refreshTokens(): string[] { return this.props.refreshTokens; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }
  public get deletedAt(): Date | null { return this.props.deletedAt; }
}

