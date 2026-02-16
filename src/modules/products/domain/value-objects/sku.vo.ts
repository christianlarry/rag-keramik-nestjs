export class SKU {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(sku: string): SKU {
    const trimmed = sku.trim().toUpperCase();

    if (trimmed.length === 0) {
      throw new Error('SKU cannot be empty');
    }

    if (trimmed.length > 100) {
      throw new Error('SKU cannot exceed 100 characters');
    }

    // SKU format validation: alphanumeric, hyphens, underscores only
    const skuPattern = /^[A-Z0-9_-]+$/;
    if (!skuPattern.test(trimmed)) {
      throw new Error(
        'SKU can only contain alphanumeric characters, hyphens, and underscores',
      );
    }

    return new SKU(trimmed);
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
