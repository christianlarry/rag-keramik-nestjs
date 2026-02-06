import { InvalidUserIdError } from "../errors";

export class UserId {
  private readonly value: string;

  private constructor(id: string) {
    this.value = id;
    this.validate();

  }

  private validate(): void {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

    if (!uuidRegex.test(this.value)) {
      throw new InvalidUserIdError(this.value);
    }
  }

  // Create a UserId from a string, validating its format
  public static fromString(id: string): UserId {
    return new UserId(id);
  }

  // Generate a new UserId
  public static generate(): UserId {
    // Generate a new UUID (v4)
    return new UserId(crypto.randomUUID());
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: UserId): boolean {
    return this.value === other.value;
  }
}