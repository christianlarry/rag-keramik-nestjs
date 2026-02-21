import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { InvalidOrderIdError } from '../errors';

export class OrderId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!isUuid(this.value)) {
      throw new InvalidOrderIdError(this.value);
    }
  }

  public static create(id?: string): OrderId {
    return new OrderId(id || uuidv4());
  }

  public static fromString(id: string): OrderId {
    return new OrderId(id);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: OrderId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
