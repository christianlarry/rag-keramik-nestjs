import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class DiscountInactiveError extends DomainError {
  readonly code = DiscountErrorCode.DISCOUNT_INACTIVE;

  constructor(discountId: string) {
    super(`Discount is inactive: ${discountId}`);
  }
}
