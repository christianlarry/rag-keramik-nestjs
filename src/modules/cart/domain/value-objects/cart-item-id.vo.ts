import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { InvalidCartItemIdError } from '../errors';

export class CartItemId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!isUuid(this.value)) {
      throw new InvalidCartItemIdError(this.value);
    }
  }

  public static create(id?: string): CartItemId {
    return new CartItemId(id || uuidv4());
  }

  public static fromString(id: string): CartItemId {
    return new CartItemId(id);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: CartItemId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
