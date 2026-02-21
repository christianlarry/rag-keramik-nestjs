import { DomainError } from 'src/core/domain/domain-error.base';
import { PaymentErrorCode } from './enums/payment-error-code.enum';

export class InvalidPaymentIdError extends DomainError {
  readonly code = PaymentErrorCode.INVALID_PAYMENT_ID;

  constructor(id: string) {
    super(`Invalid payment ID: "${id}"`);
  }
}
