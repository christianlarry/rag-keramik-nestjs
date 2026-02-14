import { InvalidAvatarError } from "../errors";

export class Avatar {
  private readonly url: string;

  private constructor(url: string) {
    this.url = url;

    this.validate();
  }

  private validate(): void {
    try {
      const parsedUrl = new URL(this.url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new InvalidAvatarError('Avatar URL must start with http:// or https://');
      }

      // Limit URL length
      if (this.url.length > 2048) {
        throw new InvalidAvatarError('Avatar URL cannot exceed 2048 characters.');
      }
    } catch (err) {
      if (!(err instanceof InvalidAvatarError)) {
        throw err;
      }
    }
  }

  public static create(url: string): Avatar {
    return new Avatar(url);
  }

  public getValue(): string {
    return this.url;
  }

  public equals(other: Avatar): boolean {
    return this.url === other.url;
  }
}