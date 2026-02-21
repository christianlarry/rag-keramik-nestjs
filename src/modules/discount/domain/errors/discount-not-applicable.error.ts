import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class DiscountNotApplicableError extends DomainError {
  readonly code = DiscountErrorCode.DISCOUNT_NOT_APPLICABLE;

  constructor(reason: string) {
    super(`Discount not applicable: ${reason}`);
  }
}
