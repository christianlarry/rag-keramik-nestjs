import { DomainError } from 'src/core/domain/domain-error.base';
import { PaymentErrorCode } from './enums/payment-error-code.enum';

export class InvalidProviderRefError extends DomainError {
  readonly code = PaymentErrorCode.INVALID_PROVIDER_REF;

  constructor(message: string = 'Provider reference is invalid') {
    super(message);
  }
}
