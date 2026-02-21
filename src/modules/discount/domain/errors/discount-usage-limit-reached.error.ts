import { DomainError } from 'src/core/domain/domain-error.base';
import { DiscountErrorCode } from './enums/discount-error-code.enum';

export class DiscountUsageLimitReachedError extends DomainError {
  readonly code = DiscountErrorCode.DISCOUNT_USAGE_LIMIT_REACHED;

  constructor(discountId: string) {
    super(`Discount usage limit reached: ${discountId}`);
  }
}
