import { Email } from "../value-objects/email.vo";

export class AuthAccount {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly email: Email,
    public readonly provider: string,
    public readonly providerId: string | null,
    private _role: string,
    private _refreshTokens: string[],
    private _emailVerified: boolean,
    private _emailVerifiedAt: Date | null,
    private _password: string,
    private _passwordChangedAt: Date | null,
    private _status: string,
    private _failedLoginAttempts: number,
  ) { }

  static create() {

  }
}