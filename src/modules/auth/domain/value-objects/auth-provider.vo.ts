import { AuthProvider as AuthProviderEnum } from "../enums/auth-provider.enum"
import { InvalidProviderError } from "../errors/invalid-provider.error";

export class AuthProvider {
  private readonly provider: AuthProviderEnum;
  private readonly providerId: string | null;

  private constructor(provider: AuthProviderEnum, providerId: string | null) {
    this.provider = provider;
    this.providerId = providerId;
  }

  public static create(provider: AuthProviderEnum, providerId: string | null): AuthProvider {
    if (!Object.values(AuthProviderEnum).includes(provider)) {
      throw new InvalidProviderError();
    }

    if (provider === AuthProviderEnum.LOCAL && providerId !== null) {
      throw new InvalidProviderError("Local provider should not have a provider ID.");
    }

    return new AuthProvider(provider, providerId);
  }

  public static createLocal(): AuthProvider {
    return new AuthProvider(AuthProviderEnum.LOCAL, null);
  }

  public static createOAuthProvider(provider: AuthProviderEnum, providerId: string): AuthProvider {
    if (provider === AuthProviderEnum.LOCAL) {
      throw new InvalidProviderError("Local provider cannot be used for OAuth.");
    }

    return new AuthProvider(provider, providerId);
  }

  public getValue(): { provider: AuthProviderEnum; providerId: string | null } {
    return {
      provider: this.provider,
      providerId: this.providerId,
    };
  }

  public getProvider(): AuthProviderEnum {
    return this.provider;
  }

  public getProviderId(): string | null {
    return this.providerId;
  }

  public equals(other: AuthProvider): boolean {
    return (
      this.provider === other.provider &&
      this.providerId === other.providerId
    );
  }

  public isLocal(): boolean {
    return this.provider === AuthProviderEnum.LOCAL;
  }

  public isOAuth(): boolean {
    return this.provider !== AuthProviderEnum.LOCAL;
  }
}