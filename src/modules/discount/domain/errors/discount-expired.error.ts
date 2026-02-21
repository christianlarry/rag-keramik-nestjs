import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class DiscountExpiredError extends DomainError {
  readonly code = DiscountErrorCode.DISCOUNT_EXPIRED;

  constructor(discountId: string) {
    super(`Discount has expired: ${discountId}`);
  }
}
