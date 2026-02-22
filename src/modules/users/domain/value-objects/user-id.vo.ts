import { UniqueIdentifier } from 'src/core/domain/unique-identifier.base';
import { InvalidUserIdError } from "../errors";

export class UserId extends UniqueIdentifier {
  private constructor(id: string) {
    super(id, new InvalidUserIdError(id));
  }

  // Create a UserId from a string, validating its format
  public static fromString(id: string): UserId {
    return new UserId(id);
  }

  // Generate a new UserId
  public static generate(): UserId {
    return new UserId(crypto.randomUUID());
  }
}