import { DomainError } from 'src/core/domain/domain-error.base';
import { PaymentErrorCode } from './enums/payment-error-code.enum';

export class InvalidPaymentStatusTransitionError extends DomainError {
  readonly code = PaymentErrorCode.INVALID_PAYMENT_STATUS_TRANSITION;

  constructor(from: string, to: string) {
    super(`Cannot transition payment status from "${from}" to "${to}"`);
  }
}
