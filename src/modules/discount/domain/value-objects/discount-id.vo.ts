import { UniqueIdentifier } from 'src/core/domain/unique-identifier.base';
import { InvalidDiscountIdError } from '../errors';

export class DiscountId extends UniqueIdentifier {
  private constructor(value: string) {
    super(value, new InvalidDiscountIdError(value));
  }

  public static generate(): DiscountId {
    const uuid = crypto.randomUUID();
    return new DiscountId(uuid);
  }

  public static fromString(value: string): DiscountId {
    return new DiscountId(value);
  }
}
