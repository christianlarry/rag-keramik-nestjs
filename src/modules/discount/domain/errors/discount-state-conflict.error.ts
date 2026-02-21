import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class DiscountStateConflictError extends DomainError {
  readonly code = DiscountErrorCode.STATE_CONFLICT;

  constructor(message: string = 'Discount state conflict error') {
    super(message);
  }
}
