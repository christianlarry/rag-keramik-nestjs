import { InvalidDiscountCodeError } from '../errors';

/**
 * DiscountCode Value Object
 *
 * Represents a unique discount/voucher code.
 * Codes are alphanumeric with hyphens, normalized to uppercase.
 */
export class DiscountCode {
  private readonly value: string;

  private constructor(code: string) {
    this.value = this.sanitize(code);
    this.validate();
  }

  private validate(): void {
    if (this.value.length === 0) {
      throw new InvalidDiscountCodeError(
        this.value,
        'Discount code cannot be empty',
      );
    }

    if (this.value.length > 100) {
      throw new InvalidDiscountCodeError(
        this.value,
        'Discount code cannot exceed 100 characters',
      );
    }

    const codePattern = /^[A-Z0-9_-]+$/;
    if (!codePattern.test(this.value)) {
      throw new InvalidDiscountCodeError(
        this.value,
        'Discount code can only contain letters, numbers, hyphens, and underscores',
      );
    }
  }

  private sanitize(code: string): string {
    return code.trim().toUpperCase();
  }

  public static create(code: string): DiscountCode {
    return new DiscountCode(code);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: DiscountCode): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
