import { DomainError } from 'src/core/domain/domain-error.base';
import { PaymentErrorCode } from './enums/payment-error-code.enum';

export class PaymentStateConflictError extends DomainError {
  readonly code = PaymentErrorCode.PAYMENT_STATE_CONFLICT;

  constructor(message: string) {
    super(message);
  }
}
