import { DomainError } from 'src/core/domain/domain-error.base';
import { PaymentErrorCode } from './enums/payment-error-code.enum';

export class PaymentProviderError extends DomainError {
  readonly code = PaymentErrorCode.PAYMENT_PROVIDER_ERROR;

  constructor(message: string) {
    super(message);
  }
}
