import { InvalidPaymentIdError } from '../errors/invalid-payment-id.error';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PaymentId Value Object
 */
export class PaymentId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    this.validate();
  }

  private validate(): void {
    if (!UUID_REGEX.test(this.value)) {
      throw new InvalidPaymentIdError(this.value);
    }
  }

  public static create(value: string): PaymentId {
    return new PaymentId(value);
  }

  public static fromString(value: string): PaymentId {
    return new PaymentId(value);
  }

  public static generate(): PaymentId {
    const uuid = crypto.randomUUID();
    return new PaymentId(uuid);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: PaymentId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
