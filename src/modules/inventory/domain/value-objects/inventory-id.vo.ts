import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { InvalidInventoryIdError } from '../errors';

export class InventoryId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!isUuid(this.value)) {
      throw new InvalidInventoryIdError(this.value);
    }
  }

  public static create(id?: string): InventoryId {
    return new InventoryId(id || uuidv4());
  }

  public static fromString(id: string): InventoryId {
    return new InventoryId(id);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: InventoryId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
