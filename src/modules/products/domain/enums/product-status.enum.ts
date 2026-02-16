export class ProductStatus {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static readonly ACTIVE = new ProductStatus('ACTIVE');
  public static readonly INACTIVE = new ProductStatus('INACTIVE');
  public static readonly DISCONTINUED = new ProductStatus('DISCONTINUED');
  public static readonly OUT_OF_STOCK = new ProductStatus('OUT_OF_STOCK');

  public static create(value: string): ProductStatus {
    const normalized = value.toUpperCase();

    switch (normalized) {
      case 'ACTIVE':
        return ProductStatus.ACTIVE;
      case 'INACTIVE':
        return ProductStatus.INACTIVE;
      case 'DISCONTINUED':
        return ProductStatus.DISCONTINUED;
      case 'OUT_OF_STOCK':
        return ProductStatus.OUT_OF_STOCK;
      default:
        throw new Error(`Invalid product status: ${value}`);
    }
  }

  public isActive(): boolean {
    return this.value === 'ACTIVE';
  }

  public isInactive(): boolean {
    return this.value === 'INACTIVE';
  }

  public isDiscontinued(): boolean {
    return this.value === 'DISCONTINUED';
  }

  public isOutOfStock(): boolean {
    return this.value === 'OUT_OF_STOCK';
  }

  public canTransitionTo(newStatus: ProductStatus): boolean {
    // Business rules for status transitions
    if (this.equals(newStatus)) {
      return true; // Same status, no transition needed
    }

    // DISCONTINUED is terminal state
    if (this.isDiscontinued()) {
      return false;
    }

    // OUT_OF_STOCK can only go to ACTIVE or DISCONTINUED
    if (this.isOutOfStock()) {
      return newStatus.isActive() || newStatus.isDiscontinued();
    }

    // ACTIVE can go to any other status
    if (this.isActive()) {
      return true;
    }

    // INACTIVE can go to ACTIVE or DISCONTINUED
    if (this.isInactive()) {
      return newStatus.isActive() || newStatus.isDiscontinued();
    }

    return false;
  }

  public equals(other: ProductStatus): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }

  public static getAllStatuses(): ProductStatus[] {
    return [
      ProductStatus.ACTIVE,
      ProductStatus.INACTIVE,
      ProductStatus.DISCONTINUED,
      ProductStatus.OUT_OF_STOCK,
    ];
  }
}
