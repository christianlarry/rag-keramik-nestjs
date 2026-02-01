import { CreateAuthAccountProps } from "../types/auth-account.type";
import { Email } from "../value-objects/email.vo";
import { Password } from "../value-objects/password.vo";
import { Role } from "../value-objects/role.vo";
import { AuthProvider } from "../value-objects/auth-provider.vo";
import { Status } from "../value-objects/status.vo";
import {
  EmailAlreadyVerifiedError,
  EmailVerificationStateMismatchError,
  InactiveAccountTokenError,
  InvalidProviderError,
  PasswordMissingError,
  SuspendedAccountActivationError,
  UnverifiedEmailActivationError,
} from "../exceptions";
import { PasswordHasher } from "../hasher/password-hasher.interface";

export class AuthAccount {
  private constructor(
    private readonly _id: string,
    private readonly _email: Email,
    private readonly _provider: AuthProvider,
    private readonly _providerId: string | null,
    private _role: Role,
    private _refreshTokens: string[],
    private _emailVerified: boolean,
    private _emailVerifiedAt: Date | null,
    private _password: Password | null,
    private _status: Status,
    private _failedLoginAttempts: number,
    private _createdAt: Date | null,
    private _updatedAt: Date | null,
    private _passwordChangedAt: Date | null,
  ) { }

  static create(props: CreateAuthAccountProps): AuthAccount {
    // Ensure consistency between emailVerified and emailVerifiedAt
    if (props.emailVerified && !props.emailVerifiedAt) {
      throw new EmailVerificationStateMismatchError('Email verified at date must be provided if email is marked as verified.');
    }

    // Ensure consistency between emailVerified and emailVerifiedAt
    if (props.emailVerifiedAt && !props.emailVerified) {
      throw new EmailVerificationStateMismatchError('Email verified flag must be true if email verified at date is provided.');
    }

    // Validate that password is provided for local provider
    if (!props.password && props.provider.isLocal()) {
      throw new PasswordMissingError();
    }

    if (!props.password && props.passwordChangedAt) {
      throw new PasswordMissingError('Password must be provided if password changed at date is set.');
    }

    // OAuth providers must have providerId
    if (!props.provider.isLocal()) {
      if (!props.providerId || props.providerId.trim().length === 0) {
        throw new InvalidProviderError(`Provider ID is required for ${props.provider} authentication`);
      }
    }

    // LOCAL provider should NOT have providerId
    if (props.provider.isLocal() && props.providerId) {
      throw new InvalidProviderError('Provider ID should not be set for local authentication');
    }

    return new AuthAccount(
      props.id,
      props.email,
      props.provider,
      props.providerId,
      props.role,
      props.refreshTokens,
      props.emailVerified,
      props.emailVerifiedAt,
      props.password,
      props.status,
      props.failedLoginAttempts,
      props.createdAt,
      props.updatedAt,
      props.passwordChangedAt,
    );
  }

  verifyEmail(): void {
    if (this._emailVerified) {
      throw new EmailAlreadyVerifiedError();
    }

    this._emailVerified = true;
    this._emailVerifiedAt = new Date();
    this._updatedAt = new Date();
  }

  isVerified(): boolean {
    return this._emailVerified;
  }

  // ═══════════════ Password Management ═══════════════

  resetPassword(newPassword: Password): void {
    // Invariant: Only local accounts can change password
    if (!this._provider.isLocal()) {
      // Throw domain error for changing password on OAuth accounts
      throw new InvalidProviderError(this._provider.getValue());
    }

    this._password = newPassword;
    this._passwordChangedAt = new Date();
    this._refreshTokens = []; // Invalidate all refresh tokens
    this._updatedAt = new Date();
  }

  async verifyPassword(password: string, hasher: PasswordHasher): Promise<boolean> {
    if (!this._password) {
      return false;
    }
    return await this._password.compare(password, hasher);
  }

  // ═══════════════ Account Status Management ═══════════════

  activate(): void {
    if (!this._emailVerified) {
      throw new UnverifiedEmailActivationError('Cannot activate account with unverified email');
    }

    if (this._status.isSuspended()) {
      throw new SuspendedAccountActivationError('Suspended account cannot be activated');
    }

    this._status = Status.createActive();
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._status = Status.createInactive();
    this._updatedAt = new Date();
  }

  suspend(): void {
    this._status = Status.createSuspended();
    this._updatedAt = new Date();
  }

  isActive(): boolean {
    return this._status.isActive();
  }

  isSuspended(): boolean {
    return this._status.isSuspended();
  }

  // ═══════════════ Failed Login Management ═══════════════

  recordFailedLogin(): void {
    this._failedLoginAttempts++;
    this._updatedAt = new Date();

    // Auto-suspend after 5 failed attempts
    if (this._failedLoginAttempts >= 5) {
      this.suspend();
    }
  }

  resetFailedLoginAttempts(): void {
    this._failedLoginAttempts = 0;
    this._updatedAt = new Date();
  }

  // ═══════════════ Refresh Token Management ═══════════════

  addRefreshToken(token: string): void {
    if (!this.isActive()) {
      // Throw domain error for adding token to inactive account
      throw new InactiveAccountTokenError('Cannot add refresh token to inactive or suspended account');
    }

    // Limit to max 5 active refresh tokens
    if (this._refreshTokens.length >= 5) {
      this._refreshTokens.shift(); // Remove oldest
    }

    this._refreshTokens.push(token);
    this._updatedAt = new Date();
  }

  removeRefreshToken(token: string): void {
    const index = this._refreshTokens.indexOf(token);
    if (index > -1) {
      this._refreshTokens.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  clearAllRefreshTokens(): void {
    this._refreshTokens = [];
    this._updatedAt = new Date();
  }

  hasRefreshToken(token: string): boolean {
    return this._refreshTokens.includes(token);
  }

  // ═══════════════ Role Management ═══════════════

  changeRole(newRole: Role): void {
    this._role = newRole;
    this._updatedAt = new Date();
  }

  hasRole(role: Role): boolean {
    return this._role.equals(role);
  }

  isAdmin(): boolean {
    return this._role.isAdmin();
  }

  // ═══════════════ Business Rules Validation ═══════════════

  canLogin(): boolean {
    return this.isActive() && this.isVerified();
  }

  requiresPasswordChange(): boolean {
    if (!this._passwordChangedAt || !this._provider.isLocal()) {
      return false;
    }

    // Password older than 90 days requires change
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return this._passwordChangedAt < ninetyDaysAgo;
  }
}