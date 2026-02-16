import { v4 as uuidv4, validate as isUuid } from 'uuid';

export class ProductId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(id?: string): ProductId {
    if (id) {
      if (!isUuid(id)) {
        throw new Error('Invalid UUID format for ProductId');
      }
      return new ProductId(id);
    }
    return new ProductId(uuidv4());
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
