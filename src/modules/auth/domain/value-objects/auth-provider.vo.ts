import { InvalidProviderError } from "../exceptions";

export class AuthProvider {
  private static readonly LOCAL = 'LOCAL';
  private static readonly GOOGLE = 'GOOGLE';
  private static readonly FACEBOOK = 'FACEBOOK';

  private constructor(private readonly value: string) { }

  static createLocal(): AuthProvider {
    return new AuthProvider(this.LOCAL);
  }

  static createGoogle(): AuthProvider {
    return new AuthProvider(this.GOOGLE);
  }

  static createFacebook(): AuthProvider {
    return new AuthProvider(this.FACEBOOK);
  }

  static fromString(value: string): AuthProvider {
    const upperValue = value.toUpperCase();

    switch (upperValue) {
      case this.LOCAL:
        return this.createLocal();
      case this.GOOGLE:
        return this.createGoogle();
      case this.FACEBOOK:
        return this.createFacebook();
      default:
        throw new InvalidProviderError(value);
    }
  }

  getValue(): string {
    return this.value;
  }

  isOAuth(): boolean {
    return this.value === AuthProvider.GOOGLE ||
      this.value === AuthProvider.FACEBOOK;
  }

  isLocal(): boolean {
    return this.value === AuthProvider.LOCAL;
  }

  isGoogle(): boolean {
    return this.value === AuthProvider.GOOGLE;
  }

  isFacebook(): boolean {
    return this.value === AuthProvider.FACEBOOK;
  }

  getDisplayName(): string {
    switch (this.value) {
      case AuthProvider.LOCAL:
        return 'Email/Password';
      case AuthProvider.GOOGLE:
        return 'Google';
      case AuthProvider.FACEBOOK:
        return 'Facebook';
      default:
        return this.value;
    }
  }

  equals(other: AuthProvider): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}