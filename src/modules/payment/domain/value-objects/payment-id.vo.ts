import { UniqueIdentifier } from 'src/core/domain/unique-identifier.base';
import { InvalidPaymentIdError } from '../errors/invalid-payment-id.error';

/**
 * PaymentId Value Object
 */
export class PaymentId extends UniqueIdentifier {
  private constructor(value: string) {
    super(value, new InvalidPaymentIdError(value));
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
}
