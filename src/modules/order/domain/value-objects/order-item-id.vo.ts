import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { InvalidOrderItemIdError } from '../errors';

export class OrderItemId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!isUuid(this.value)) {
      throw new InvalidOrderItemIdError(this.value);
    }
  }

  public static create(id?: string): OrderItemId {
    return new OrderItemId(id || uuidv4());
  }

  public static fromString(id: string): OrderItemId {
    return new OrderItemId(id);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: OrderItemId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
