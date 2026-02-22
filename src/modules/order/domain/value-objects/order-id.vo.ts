import { UniqueIdentifier } from 'src/core/domain/unique-identifier.base';
import { InvalidOrderIdError } from '../errors';

export class OrderId extends UniqueIdentifier {
  private constructor(value: string) {
    super(value, new InvalidOrderIdError(value));
  }

  public static generate(): OrderId {
    const uuid = crypto.randomUUID();
    return new OrderId(uuid);
  }

  public static fromString(value: string): OrderId {
    return new OrderId(value);
  }
}
