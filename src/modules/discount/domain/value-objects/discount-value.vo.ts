import { DiscountType } from '../enums/discount-type.enum';
import { InvalidDiscountValueError } from '../errors';

interface DiscountValueProps {
  type: DiscountType;
  value: number;
  maxDiscount?: number;
}

/**
 * DiscountValue Value Object
 *
 * Encapsulates discount type, value, and optional maximum cap.
 * - PERCENTAGE: value is 0-100, maxDiscount caps the absolute amount
 * - FIXED_AMOUNT: value is the absolute discount amount
 */
export class DiscountValue {
  private readonly type: DiscountType;
  private readonly value: number;
  private readonly maxDiscount: number | null;

  private constructor(props: DiscountValueProps) {
    this.type = props.type;
    this.value = Math.round(props.value * 100) / 100;
    this.maxDiscount = props.maxDiscount
      ? Math.round(props.maxDiscount * 100) / 100
      : null;
    this.validate();
  }

  private validate(): void {
    if (!Number.isFinite(this.value)) {
      throw new InvalidDiscountValueError('Value must be a valid number');
    }

    if (this.value <= 0) {
      throw new InvalidDiscountValueError('Value must be greater than 0');
    }

    if (this.type === DiscountType.PERCENTAGE) {
      if (this.value > 100) {
        throw new InvalidDiscountValueError(
          'Percentage discount cannot exceed 100%',
        );
      }
    }

    if (this.maxDiscount !== null) {
      if (!Number.isFinite(this.maxDiscount)) {
        throw new InvalidDiscountValueError(
          'Max discount must be a valid number',
        );
      }

      if (this.maxDiscount <= 0) {
        throw new InvalidDiscountValueError(
          'Max discount must be greater than 0',
        );
      }
    }
  }

  public static create(props: DiscountValueProps): DiscountValue {
    return new DiscountValue(props);
  }

  /**
   * Calculate the discount amount for a given purchase amount
   */
  public calculateDiscount(purchaseAmount: number): number {
    let discount: number;

    if (this.type === DiscountType.PERCENTAGE) {
      discount = (purchaseAmount * this.value) / 100;

      // Apply max discount cap
      if (this.maxDiscount !== null && discount > this.maxDiscount) {
        discount = this.maxDiscount;
      }
    } else {
      // FIXED_AMOUNT
      discount = this.value;
    }

    // Discount cannot exceed purchase amount
    return Math.min(Math.round(discount * 100) / 100, purchaseAmount);
  }

  public getType(): DiscountType {
    return this.type;
  }

  public getValue(): number {
    return this.value;
  }

  public getMaxDiscount(): number | null {
    return this.maxDiscount;
  }

  public isPercentage(): boolean {
    return this.type === DiscountType.PERCENTAGE;
  }

  public isFixedAmount(): boolean {
    return this.type === DiscountType.FIXED_AMOUNT;
  }

  public equals(other: DiscountValue): boolean {
    return (
      this.type === other.type &&
      this.value === other.value &&
      this.maxDiscount === other.maxDiscount
    );
  }

  public toString(): string {
    if (this.isPercentage()) {
      const cap =
        this.maxDiscount !== null ? ` (max ${this.maxDiscount})` : '';
      return `${this.value}%${cap}`;
    }
    return `${this.value}`;
  }
}
