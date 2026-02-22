import { UniqueIdentifier } from 'src/core/domain/unique-identifier.base';
import { InvalidOrderItemIdError } from '../errors';

export class OrderItemId extends UniqueIdentifier {
  private constructor(value: string) {
    super(value, new InvalidOrderItemIdError(value));
  }

  public static generate(): OrderItemId {
    const uuid = crypto.randomUUID();
    return new OrderItemId(uuid);
  }

  public static fromString(value: string): OrderItemId {
    return new OrderItemId(value);
  }
}
