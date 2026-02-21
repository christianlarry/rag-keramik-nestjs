import { DomainError } from 'src/core/domain/domain-error.base';
import { PaymentErrorCode } from './enums/payment-error-code.enum';

export class InvalidPaymentAmountError extends DomainError {
  readonly code = PaymentErrorCode.INVALID_PAYMENT_AMOUNT;

  constructor(message: string = 'Payment amount is invalid') {
    super(message);
  }
}
