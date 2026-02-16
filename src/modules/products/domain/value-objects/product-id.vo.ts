import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { InvalidProductIdError } from '../errors';

export class ProductId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!isUuid(this.value)) {
      throw new InvalidProductIdError(this.value);
    }
  }

  public static create(id?: string): ProductId {
    return new ProductId(id || uuidv4());
  }

  public static fromString(id: string): ProductId {
    return new ProductId(id);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: ProductId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
