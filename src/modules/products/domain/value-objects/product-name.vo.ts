import { InvalidProductNameError } from '../errors';

export class ProductName {
  private readonly value: string;

  private constructor(name: string) {
    this.value = this.sanitize(name);
    this.validate();
  }

  private validate(): void {
    if (this.value.length === 0) {
      throw new InvalidProductNameError(
        this.value,
        'Product name cannot be empty',
      );
    }

    if (this.value.length > 500) {
      throw new InvalidProductNameError(
        this.value,
        'Product name cannot exceed 500 characters',
      );
    }
  }

  private sanitize(name: string): string {
    return name.trim();
  }

  public static create(name: string): ProductName {
    return new ProductName(name);
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
