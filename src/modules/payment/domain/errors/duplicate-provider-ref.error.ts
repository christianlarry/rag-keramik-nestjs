import { DomainError } from 'src/core/domain/domain-error.base';
import { PaymentErrorCode } from './enums/payment-error-code.enum';

export class DuplicateProviderRefError extends DomainError {
  readonly code = PaymentErrorCode.DUPLICATE_PROVIDER_REF;

  constructor(providerRef: string) {
    super(`Provider reference already exists: "${providerRef}"`);
  }
}
