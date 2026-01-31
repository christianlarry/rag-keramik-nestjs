import { EmailAlreadyVerifiedError, EmailVerificationStateMismatchError } from "src/modules/users/domain/errors";
import { CreateAuthAccountProps } from "../types/auth-account.type";
import { Email } from "../value-objects/email.vo";
import { Password } from "../value-objects/password.vo";
import { PasswordMissingError } from "src/modules/users/domain/errors/password/password-missing.error";
import { Role } from "../value-objects/role.vo";
import { AuthProvider } from "../value-objects/auth-provider.vo";
import { Status } from "../value-objects/status.vo";

export class AuthAccount {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly email: Email,
    public readonly provider: AuthProvider,
    public readonly providerId: string | null,
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
    if (!props.password && props.provider === AuthProvider.Local) {
      throw new PasswordMissingError();
    }

    // OAuth providers must have providerId
    if (props.provider !== AuthProvider.Local) {
      if (!props.providerId || props.providerId.trim().length === 0) {
        throw new Error(`Provider ID is required for ${props.provider} authentication`);
      }
    }

    // LOCAL provider should NOT have providerId
    if (props.provider === AuthProvider.Local && props.providerId) {
      throw new Error('Provider ID should not be set for local authentication');
    }

    return new AuthAccount(
      props.id,
      props.userId,
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
}