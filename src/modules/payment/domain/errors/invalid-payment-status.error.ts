import { DomainError } from 'src/core/domain/domain-error.base';
import { PaymentErrorCode } from './enums/payment-error-code.enum';

export class InvalidPaymentStatusError extends DomainError {
  readonly code = PaymentErrorCode.INVALID_PAYMENT_STATUS;

  constructor(status: string) {
    super(`Invalid payment status: "${status}"`);
  }
}
