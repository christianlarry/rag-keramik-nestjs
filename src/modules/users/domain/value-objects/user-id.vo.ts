import { InvalidUserIdError } from "../errors";

export class UserId {
  private readonly value: string;

  private constructor(id: string) {
    this.value = id;
  }

  public static create(id: string): UserId {
    // Validate that user ID is a non-empty string & is a UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      throw new InvalidUserIdError(id);
    }

    return new UserId(id);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: UserId): boolean {
    return this.value === other.value;
  }
}