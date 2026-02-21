import { InvalidProviderRefError } from '../errors/invalid-provider-ref.error';

/**
 * ProviderRef Value Object
 *
 * Represents the external payment provider's reference/order ID.
 * For Midtrans, this is the order_id sent to the payment gateway.
 */
export class ProviderRef {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value.trim();
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.length === 0) {
      throw new InvalidProviderRefError(
        'Provider reference cannot be empty',
      );
    }

    if (this.value.length > 255) {
      throw new InvalidProviderRefError(
        'Provider reference cannot exceed 255 characters',
      );
    }
  }

  public static create(value: string): ProviderRef {
    return new ProviderRef(value);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: ProviderRef): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
