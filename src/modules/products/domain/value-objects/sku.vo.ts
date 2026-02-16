import { InvalidSKUError } from '../errors';

export class SKU {
  private readonly value: string;

  private constructor(sku: string) {
    this.value = this.sanitize(sku);
    this.validate();
  }

  private validate(): void {
    if (this.value.length === 0) {
      throw new InvalidSKUError(this.value, 'SKU cannot be empty');
    }

    if (this.value.length > 100) {
      throw new InvalidSKUError(
        this.value,
        'SKU cannot exceed 100 characters',
      );
    }

    // SKU format validation: alphanumeric, hyphens, underscores only
    const skuPattern = /^[A-Z0-9_-]+$/;
    if (!skuPattern.test(this.value)) {
      throw new InvalidSKUError(
        this.value,
        'SKU can only contain alphanumeric characters, hyphens, and underscores',
      );
    }
  }

  private sanitize(sku: string): string {
    return sku.trim().toUpperCase();
  }

  public static create(sku: string): SKU {
    return new SKU(sku);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: SKU): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
