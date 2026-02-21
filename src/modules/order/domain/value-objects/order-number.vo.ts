import { InvalidOrderNumberError } from '../errors';

/**
 * OrderNumber Value Object
 *
 * Represents a unique, idempotent order reference number.
 * Format: ORD-YYYYMMDD-XXXXX (e.g., ORD-20260221-A1B2C)
 */
export class OrderNumber {
  private readonly value: string;

  private constructor(value: string) {
    this.value = this.sanitize(value);
    this.validate();
  }

  private validate(): void {
    if (this.value.length === 0) {
      throw new InvalidOrderNumberError(
        this.value,
        'Order number cannot be empty',
      );
    }

    if (this.value.length > 100) {
      throw new InvalidOrderNumberError(
        this.value,
        'Order number cannot exceed 100 characters',
      );
    }

    // Must start with ORD- prefix
    const orderNumberPattern = /^ORD-\d{8}-[A-Z0-9]{5,}$/;
    if (!orderNumberPattern.test(this.value)) {
      throw new InvalidOrderNumberError(
        this.value,
        'Order number must follow format: ORD-YYYYMMDD-XXXXX',
      );
    }
  }

  private sanitize(value: string): string {
    return value.trim().toUpperCase();
  }

  /**
   * Create a new order number with today's date
   */
  public static generate(): OrderNumber {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = crypto.randomUUID().slice(0, 8).toUpperCase();
    return new OrderNumber(`ORD-${dateStr}-${randomPart}`);
  }

  /**
   * Create from existing value
   */
  public static create(orderNumber: string): OrderNumber {
    return new OrderNumber(orderNumber);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: OrderNumber): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
