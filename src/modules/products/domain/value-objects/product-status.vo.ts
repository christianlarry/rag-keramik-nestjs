import { ProductStatusEnum } from '../enums';
import { InvalidProductStatusError } from '../errors';

export class ProductStatus {
  private readonly value: ProductStatusEnum;

  private constructor(value: ProductStatusEnum) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!Object.values(ProductStatusEnum).includes(this.value)) {
      throw new InvalidProductStatusError(this.value);
    }
  }

  public static create(value: string): ProductStatus {
    return new ProductStatus(value as ProductStatusEnum);
  }

  public static createActive(): ProductStatus {
    return new ProductStatus(ProductStatusEnum.ACTIVE);
  }

  public static createInactive(): ProductStatus {
    return new ProductStatus(ProductStatusEnum.INACTIVE);
  }

  public static createDiscontinued(): ProductStatus {
    return new ProductStatus(ProductStatusEnum.DISCONTINUED);
  }

  public static createOutOfStock(): ProductStatus {
    return new ProductStatus(ProductStatusEnum.OUT_OF_STOCK);
  }

  public static createDeleted(): ProductStatus {
    return new ProductStatus(ProductStatusEnum.DELETED);
  }

  public getValue(): ProductStatusEnum {
    return this.value;
  }

  public equals(other: ProductStatus): boolean {
    return this.value === other.value;
  }

  public isActive(): boolean {
    return this.value === ProductStatusEnum.ACTIVE;
  }

  public isInactive(): boolean {
    return this.value === ProductStatusEnum.INACTIVE;
  }

  public isDiscontinued(): boolean {
    return this.value === ProductStatusEnum.DISCONTINUED;
  }

  public isOutOfStock(): boolean {
    return this.value === ProductStatusEnum.OUT_OF_STOCK;
  }

  public isDeleted(): boolean {
    return this.value === ProductStatusEnum.DELETED;
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

  public toString(): string {
    return this.value;
  }
}
