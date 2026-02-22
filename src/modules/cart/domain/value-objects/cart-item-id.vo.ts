import { UniqueIdentifier } from 'src/core/domain/unique-identifier.base';
import { InvalidCartItemIdError } from '../errors';

export class CartItemId extends UniqueIdentifier {
  private constructor(value: string) {
    super(value, new InvalidCartItemIdError(value));
  }

  public static generate(): CartItemId {
    const uuid = crypto.randomUUID();
    return new CartItemId(uuid);
  }

  public static fromString(value: string): CartItemId {
    return new CartItemId(value);
  }
}
