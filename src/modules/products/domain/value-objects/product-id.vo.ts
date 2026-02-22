import { UniqueIdentifier } from 'src/core/domain/unique-identifier.base';
import { InvalidProductIdError } from '../errors';

export class ProductId extends UniqueIdentifier {
  private constructor(value: string) {
    super(value, new InvalidProductIdError(value));
  }

  public static generate(): ProductId {
    const uuid = crypto.randomUUID();
    return new ProductId(uuid);
  }

  public static fromString(value: string): ProductId {
    return new ProductId(value);
  }
}