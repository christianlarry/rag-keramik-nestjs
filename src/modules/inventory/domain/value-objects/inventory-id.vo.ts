import { UniqueIdentifier } from 'src/core/domain/unique-identifier.base';
import { InvalidInventoryIdError } from '../errors';

export class InventoryId extends UniqueIdentifier {
  private constructor(value: string) {
    super(value, new InvalidInventoryIdError(value));
  }

  public static generate(): InventoryId {
    const uuid = crypto.randomUUID();
    return new InventoryId(uuid);
  }

  public static fromString(value: string): InventoryId {
    return new InventoryId(value);
  }
}
