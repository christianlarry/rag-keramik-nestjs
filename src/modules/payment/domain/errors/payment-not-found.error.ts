import { DomainError } from 'src/core/domain/domain-error.base';
import { PaymentErrorCode } from './enums/payment-error-code.enum';

export class PaymentNotFoundError extends DomainError {
  readonly code = PaymentErrorCode.PAYMENT_NOT_FOUND;

  constructor(identifier: string) {
    super(`Payment not found: "${identifier}"`);
  }
}
