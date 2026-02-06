import { InvalidAvatarError } from "../errors";

export class Avatar {
  private readonly url: string;

  private constructor(url: string) {
    this.url = url;

    this.validate();
  }

  private validate(): void {
    // Basic URL validation
    const urlPattern = /^(https?:\/\/)[\w.-]+(\.[w.-]+)+[/#?]?.*$/;
    if (!urlPattern.test(this.url)) {
      throw new InvalidAvatarError('Invalid avatar URL format.');
    }

    // Check for allowed image extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = allowedExtensions.some(ext => this.url.toLowerCase().endsWith(ext));
    if (!hasValidExtension) {
      throw new InvalidAvatarError('Avatar URL must point to a valid image format (jpg, jpeg, png, gif, webp).');
    }

    // Limit URL length
    if (this.url.length > 2048) {
      throw new InvalidAvatarError('Avatar URL cannot exceed 2048 characters.');
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