import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { InvalidCartIdError } from '../errors';

export class CartId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!isUuid(this.value)) {
      throw new InvalidCartIdError(this.value);
    }
  }

  public static create(id?: string): CartId {
    return new CartId(id || uuidv4());
  }

  public static fromString(id: string): CartId {
    return new CartId(id);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: CartId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
