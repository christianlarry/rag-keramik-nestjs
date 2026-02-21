import { DomainError } from 'src/core/domain/domain-error.base';
import { PaymentErrorCode } from './enums/payment-error-code.enum';

export class PaymentAlreadyExistsError extends DomainError {
  readonly code = PaymentErrorCode.PAYMENT_ALREADY_EXISTS;

  constructor(identifier: string) {
    super(`Payment already exists: "${identifier}"`);
  }
}
