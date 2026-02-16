export class ProductName {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(name: string): ProductName {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      throw new Error('Product name cannot be empty');
    }

    if (trimmed.length > 500) {
      throw new Error('Product name cannot exceed 500 characters');
    }

    return new ProductName(trimmed);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: ProductName): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
