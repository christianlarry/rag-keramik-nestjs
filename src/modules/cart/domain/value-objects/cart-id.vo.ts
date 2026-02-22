import { UniqueIdentifier } from 'src/core/domain/unique-identifier.base';
import { InvalidCartIdError } from '../errors';

export class CartId extends UniqueIdentifier {
  private constructor(value: string) {
    super(value, new InvalidCartIdError(value));
  }

  public static generate(): CartId {
    const uuid = crypto.randomUUID();
    return new CartId(uuid);
  }

  public static fromString(value: string): CartId {
    return new CartId(value);
  }
}
